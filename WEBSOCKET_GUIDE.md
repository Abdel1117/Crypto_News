# Architecture WebSocket — Crypto Dashboard

## Vue d'ensemble

Ce projet utilise une connexion **WebSocket** entre le frontend (Next.js) et le backend (FastAPI) pour recevoir les prix des cryptos **en temps réel**, sans que le client ait besoin de faire des requêtes répétées.

### Pourquoi WebSocket plutôt que du polling HTTP ?

Avec du HTTP classique (`fetch` toutes les X secondes) :
```
Client ──► GET /markets ──► Serveur ──► CoinGecko
Client ◄── réponse ◄────── Serveur
(attendre 10s)
Client ──► GET /markets ──► Serveur ──► CoinGecko
Client ◄── réponse ◄────── Serveur
...
```
Problème : chaque requête ouvre une nouvelle connexion, envoie des headers HTTP, attend la réponse. C'est lourd et lent.

Avec WebSocket :
```
Client ═══════════ connexion persistante ═══════════ Serveur
         ◄── données ──
         ◄── données ──
         ◄── données ──
         ──► { currency: "usd" } ──►    (le client peut aussi envoyer)
         ◄── données ──
```
Une seule connexion reste ouverte. Le serveur **pousse** les données quand elles sont prêtes.

---

## Architecture des fichiers

```
frontend/app/lib/
├── store.ts                         # Store Redux singleton
├── initSocket.ts                    # Point d'entrée : connecte le WS et branche les channels
├── ws/
│   ├── socket.ts                    # Couche infra : gère la connexion WS brute
│   └── channels/
│       ├── index.ts                 # Ré-exporte tous les handlers de channels
│       └── markets.ts              # Handler du channel "markets"
└── features/prices/
    ├── pricesSlice.ts               # Slice Redux (state + reducers)
    └── pricesThunks.ts              # Thunks (ancien fetch HTTP, gardé en fallback)

frontend/app/providers/
├── socket-provider.tsx              # Composant React qui initialise le WS au montage
├── redux-provider.tsx               # Fournit le store Redux à l'app
└── root-providers.tsx               # Compose tous les providers ensemble

backend/app/
├── controllers/
│   └── market_controller.py         # Endpoint REST GET + endpoint WebSocket
└── services/
    ├── market_service.py            # Logique métier (transforme les données CoinGecko)
    └── ws_manager.py                # Gère les connexions WS actives + broadcast
```

---

## Flux de données complet

```
                        BACKEND                                    FRONTEND
                                                                     
CoinGecko API                                                  React Components
     │                                                              ▲
     │ (HTTP fetch)                                                 │ useAppSelector()
     ▼                                                              │
MarketService.get_top_markets()                              Redux Store (prices)
     │                                                              ▲
     │ retourne [{id, name, price, ...}]                            │ dispatch(setCoins(data))
     ▼                                                              │
WebSocket Endpoint                                           channels/markets.ts
     │                                                              ▲
     │ broadcast({ channel: "markets", data: [...] })               │ handler appelé
     ▼                                                              │
ConnectionManager ──── WebSocket (connexion persistante) ────► socket.ts (onmessage)
                                                                    │
                                                              route par "channel"
                                                              → listeners.get("markets")
```

---

## Explication fichier par fichier

### 1. `ws/socket.ts` — La couche infrastructure

C'est le **cœur technique**. Ce fichier gère la connexion WebSocket brute. Il ne sait rien de Redux, ni de React.

```typescript
// Ouvrir la connexion
connect()

// S'abonner à un channel (retourne une fonction pour se désabonner)
const unsub = subscribe("markets", (data) => { ... })

// Envoyer un message au serveur
send({ currency: "usd" })

// Fermer proprement
disconnect()
```

**Comment ça marche :**

1. `connect()` crée un `new WebSocket(url)` vers le backend
2. Quand un message arrive (`onmessage`), il est parsé en JSON : `{ channel: "markets", data: [...] }`
3. Le `channel` est utilisé pour trouver les handlers enregistrés via `subscribe()`
4. Si la connexion se ferme (`onclose`), elle se **reconnecte automatiquement** après 3 secondes

**Le pattern subscribe/publish :**
```typescript
// Enregistrer un handler
subscribe("markets", handler)  // → stocké dans : Map { "markets" → Set { handler } }

// Quand un message arrive avec channel = "markets"
// → tous les handlers du Set sont appelés avec message.data
```

C'est comme un `addEventListener` mais organisé par "channel".

---

### 2. `ws/channels/markets.ts` — Le handler du channel "markets"

C'est le **pont entre WebSocket et Redux**. Chaque channel a son propre handler.

```typescript
export function registerMarketsChannel(dispatch: AppDispatch) {
  // Retourne une fonction qui sera appelée à chaque message sur le channel "markets"
  return (data: unknown) => {
    dispatch(setConnected(true));   // Marquer qu'on est connecté
    dispatch(setCoins(data));       // Mettre à jour les coins dans Redux
  };
}
```

**Pourquoi cette séparation ?**

- `socket.ts` ne connaît pas Redux → il peut être testé seul
- `markets.ts` ne connaît pas WebSocket → il reçoit juste de la data et dispatch
- Pour ajouter un nouveau channel (ex: "news"), tu crées un fichier `channels/news.ts` avec le même pattern

---

### 3. `initSocket.ts` — Le point d'entrée

Ce fichier **assemble** les pièces : il branche les channels sur le socket et démarre la connexion.

```typescript
export function initSocket() {
  // Protection : ne s'exécute qu'une seule fois
  if (initialized) return;
  initialized = true;

  // 1. Récupérer dispatch depuis le store singleton
  const dispatch = store.dispatch;

  // 2. Signaler que le chargement est en cours
  dispatch(setLoading(true));

  // 3. Brancher le channel "markets" sur le socket
  subscribe("markets", registerMarketsChannel(dispatch));

  // 4. Ouvrir la connexion WebSocket
  connect();
}
```

**Pourquoi un store singleton ?** Parce que `initSocket()` est appelé en dehors de React (pas dans un composant). Il ne peut pas utiliser `useDispatch()`. Donc le store est exporté directement depuis `store.ts` et importé ici.

---

### 4. `store.ts` — Le store Redux singleton

Avant :
```typescript
// ❌ Ancien : crée un nouveau store à chaque appel
export const makeStore = () => configureStore({ ... })
```

Après :
```typescript
// ✅ Nouveau : un seul store pour toute l'app
export const store = configureStore({ ... })
```

Ça permet à `initSocket.ts` d'importer `store.dispatch` directement.

---

### 5. `pricesSlice.ts` — Le state Redux

```typescript
interface PriceState {
  coins: { ... }       // Les données des cryptos
  loading: boolean     // true pendant la connexion initiale
  connected: boolean   // true une fois que le WS a envoyé des données
}
```

Reducers ajoutés :
- `setCoins(data)` — remplace les coins (appelé par le channel handler)
- `setLoading(bool)` — toggle le loading
- `setConnected(bool)` — indique si on reçoit des données du WS

Les `extraReducers` (getPrices thunk) sont conservés en **fallback** si le WS ne marche pas.

---

### 6. `socket-provider.tsx` — L'initialisation côté React

```tsx
export function SocketProvider({ children }) {
  useEffect(() => {
    initSocket();  // Appelé une seule fois au montage
  }, []);

  return <>{children}</>;
}
```

C'est un composant React dont le seul rôle est d'appeler `initSocket()` quand l'app se monte côté client. Il est placé dans `root-providers.tsx` **après** le `ReduxProvider` (car il a besoin que le store existe).

---

### 7. Backend — `market_controller.py` (endpoint WebSocket)

```python
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)        # 1. Accepter la connexion
    service = get_market_service()
    currency = "eur"
    try:
        while True:                         # 2. Boucle infinie
            data = await service.get_top_markets(currency, ...)
            await manager.broadcast("markets", data)  # 3. Envoyer à tous

            try:
                msg = await asyncio.wait_for(
                    websocket.receive_json(),
                    timeout=30                # 4. Attendre 30s un message client
                )
                if "currency" in msg:
                    currency = msg["currency"]  # 5. Changer la devise si demandé
            except asyncio.TimeoutError:
                pass                          # 6. Pas de message → re-boucler
    except WebSocketDisconnect:
        manager.disconnect(websocket)         # 7. Nettoyage à la déco
```

**Le cycle :**
1. Le client se connecte
2. Le serveur fetch CoinGecko et envoie les données
3. Il attend 30 secondes un message du client (ex: changement de devise)
4. Si rien ne vient → il refetch et renvoie
5. Si le client envoie `{ "currency": "usd" }` → il change la devise pour les prochains fetchs
6. Si le client se déconnecte → cleanup

---

### 8. Backend — `ws_manager.py` (gestion des connexions)

```python
class ConnectionManager:
    active: list[WebSocket]  # Liste de toutes les connexions ouvertes

    async def connect(ws):    # Ajouter un client
    def disconnect(ws):       # Retirer un client
    async def broadcast(channel, data):  # Envoyer à TOUS les clients
```

Le `broadcast` envoie toujours un JSON avec cette forme :
```json
{
  "channel": "markets",
  "data": [{ "id": "bitcoin", "price": 34850.10, ... }]
}
```

Le `channel` permet au frontend de router le message vers le bon handler.

---

## Ajouter un nouveau channel (exemple : "news")

1. **Backend** : dans `websocket_endpoint`, ajouter un `broadcast("news", news_data)`

2. **Frontend** : créer `ws/channels/news.ts` :
```typescript
export function registerNewsChannel(dispatch: AppDispatch) {
  return (data: unknown) => {
    dispatch(setNews(data));
  };
}
```

3. **Frontend** : dans `initSocket.ts`, ajouter :
```typescript
subscribe("news", registerNewsChannel(dispatch));
```

C'est tout. Le socket, le routing par channel, et le provider restent inchangés.

---

## Envoyer un message au serveur depuis le frontend

Par exemple, changer la devise :

```typescript
import { send } from "@/app/lib/ws/socket";

send({ currency: "usd" });
```

Le backend le recevra dans `websocket.receive_json()` et adaptera son comportement.

---

## Variables d'environnement

Dans `frontend/.env` :
```
NEXT_PUBLIC_API_BACK_END=http://localhost:4000    # Pour les appels REST (fallback)
NEXT_PUBLIC_WS_BACK_END=ws://localhost:4000       # Pour le WebSocket
```

Note : le protocole est `ws://` (pas `http://`). En production avec HTTPS, ce sera `wss://`.

---

## Ordre d'initialisation

```
1. Next.js rend le layout
2. root-providers.tsx monte les providers :
   ReduxProvider (crée le store)
   └── SocketProvider (appelle initSocket)
       └── ... reste de l'app
3. initSocket() :
   - subscribe("markets", handler)
   - connect()  → new WebSocket("ws://localhost:4000/markets/ws")
4. Backend accepte la connexion
5. Backend fetch CoinGecko → broadcast({ channel: "markets", data: [...] })
6. Frontend socket.ts reçoit le message → route vers le handler "markets"
7. Handler dispatch setCoins(data) dans Redux
8. Dashboard relut le state via useAppSelector → affiche les cards
```

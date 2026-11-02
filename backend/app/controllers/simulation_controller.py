from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.clients.coingecko_client import CoinGeckoClient
from app.db.session import get_session
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.repositories.simulation.simulation_sql_repo import SQLSimulationRepository
from app.schemas.simulation import (
    CountryOut,
    PortfolioCreate,
    PortfolioOut,
    PortfolioUpdate,
    TradeCreate,
    TradeOut,
    TradesPage,
)
from app.services.market_service import MarketService
from app.services.simulation.simulation_service import SimulationService, list_countries

router = APIRouter(prefix="/simulation", tags=["simulation"])


def get_simulation_service(session: AsyncSession = Depends(get_session)) -> SimulationService:
    return SimulationService(SQLSimulationRepository(session), MarketService(CoinGeckoClient()))


@router.get("/countries", response_model=list[CountryOut])
async def get_countries():
    """Public: the supported countries and their tax rules, for onboarding."""
    return list_countries()


@router.get("/portfolio", response_model=PortfolioOut)
async def get_portfolio(
    user: User = Depends(get_current_user),
    service: SimulationService = Depends(get_simulation_service),
):
    return await service.view(user.id)


@router.post("/portfolio", response_model=PortfolioOut, status_code=status.HTTP_201_CREATED)
async def create_portfolio(
    data: PortfolioCreate,
    user: User = Depends(get_current_user),
    service: SimulationService = Depends(get_simulation_service),
):
    return await service.create(user.id, data)


@router.patch("/portfolio", response_model=PortfolioOut)
async def update_portfolio(
    data: PortfolioUpdate,
    user: User = Depends(get_current_user),
    service: SimulationService = Depends(get_simulation_service),
):
    return await service.update_country(user.id, data)


@router.post("/portfolio/reset", response_model=PortfolioOut)
async def reset_portfolio(
    data: PortfolioCreate,
    user: User = Depends(get_current_user),
    service: SimulationService = Depends(get_simulation_service),
):
    return await service.reset(user.id, data)


@router.post("/trades", response_model=TradeOut, status_code=status.HTTP_201_CREATED)
async def place_trade(
    data: TradeCreate,
    user: User = Depends(get_current_user),
    service: SimulationService = Depends(get_simulation_service),
):
    return await service.place_trade(user.id, data)


@router.get("/trades", response_model=TradesPage)
async def list_trades(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    service: SimulationService = Depends(get_simulation_service),
):
    return await service.trades(user.id, limit, offset)

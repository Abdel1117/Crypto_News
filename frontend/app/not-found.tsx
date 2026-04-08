import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0e1013",
        color: "#fff",
      }}
    >
      <h1 style={{ fontSize: "6rem", margin: 0 }}>404</h1>
      <h2 style={{ fontSize: "2rem", margin: "1rem 0" }}>Page non trouvée</h2>
      <p style={{ marginBottom: "2rem" }}>
        Désolé, la page que vous cherchez n'existe pas ou a été déplacée.
      </p>
      <Link href="/">
        <span
          style={{
            padding: "0.75rem 2rem",
            background: "#1e293b",
            borderRadius: "0.5rem",
            color: "#fff",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "1.1rem",
            transition: "background 0.2s",
          }}
        >
          Retour à l'accueil
        </span>
      </Link>
    </div>
  );
}

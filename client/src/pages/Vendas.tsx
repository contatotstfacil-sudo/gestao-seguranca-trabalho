import { useEffect } from "react";

// Redireciona para a landing estática já existente em public/landing-vendas.html
export default function Vendas() {
  useEffect(() => {
    window.location.replace("/landing-vendas.html");
  }, []);

  return null;
}





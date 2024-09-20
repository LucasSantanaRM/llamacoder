import styles from "./loading-dots.module.css";

interface LoadingDotsProps {
  color?: string; // Agora é opcional
  style?: "small" | "large"; // Definindo estilos possíveis
}

export default function LoadingDots({
  color = "#000",
  style = "small", // Valor padrão
}: LoadingDotsProps) {
  return (
    <span className={style === "small" ? styles.loading2 : styles.loading}>
      <span style={{ backgroundColor: color }} />
      <span style={{ backgroundColor: color }} />
      <span style={{ backgroundColor: color }} />
    </span>
  );
}

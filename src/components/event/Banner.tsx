import type { ImageAsset } from "@/data/images";
import { cn } from "@/lib/utils";

/**
 * Largura que a imagem ocupa na tela, por faixa — usada pelo navegador para
 * escolher o arquivo do `srcset`.
 *
 * Reflete o layout do banner: recuo lateral de 16px no celular e 24px acima
 * disso, com o conteúdo limitado a 1024px (`max-w-5xl`). Ou seja, a largura
 * disponível é `min(1024, 100vw - recuo)` — o que dá 1024px cheios a partir de
 * 1072px de viewport.
 *
 * ⚠️  Se o recuo ou o `max-w-` do container do banner mudar em index.tsx, estes
 *     valores precisam mudar junto: declarar largura menor que a real faz o
 *     navegador escolher um arquivo de resolução insuficiente.
 */
const SIZES = [
  "(max-width: 639px) calc(100vw - 32px)",
  "(max-width: 1071px) calc(100vw - 48px)",
  "1024px",
].join(", ");

/**
 * Exibe uma imagem do registro em src/data/images.ts, responsiva e sem layout
 * shift.
 *
 * As variantes (`mobile`, `tablet`, `src`) são oferecidas ao navegador como
 * `srcset`, cada uma anotada com sua largura real. O navegador baixa UMA — a
 * menor que ainda atende o tamanho exibido e a densidade da tela — e ignora as
 * outras. Em telas grandes ele pega a versão de desktop; no celular, a leve.
 *
 * Para trocar ou adicionar imagens, edite o registro — não este componente.
 *
 * ⚠️  Isto faz troca por RESOLUÇÃO: todas as variantes precisam ter a mesma
 *     composição e proporção, mudando só o tamanho. Se algum dia o celular
 *     precisar de um recorte diferente (ex: quadrado, com o texto maior), aí
 *     sim é caso de <picture> com media queries — e o `sizes` acima deixa de
 *     valer, porque a proporção passaria a variar por faixa de tela.
 *
 * `priority` deve ficar true apenas para imagens visíveis sem rolar a página
 * (como o banner do topo): o navegador as busca imediatamente em vez de
 * postergar. Usar em imagens abaixo da dobra desperdiça banda.
 */
export function Banner({
  image,
  priority = false,
  className,
}: {
  image: ImageAsset;
  priority?: boolean;
  className?: string;
}) {
  // Sem duplicar larguras: variantes com a mesma largura da principal seriam
  // candidatas equivalentes e o navegador escolheria qualquer uma.
  const candidates = [image.mobile, image.tablet, image]
    .filter((variant): variant is NonNullable<typeof variant> => Boolean(variant))
    .filter(
      (variant, index, all) => all.findIndex((other) => other.width === variant.width) === index,
    );

  return (
    <img
      // srcSet/sizes antes de src: o React aplica os atributos nesta ordem, e o
      // navegador precisa conhecer as candidatas antes de começar o download.
      srcSet={candidates.map((variant) => `${variant.src} ${variant.width}w`).join(", ")}
      sizes={SIZES}
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={cn("h-auto w-full", className)}
    />
  );
}

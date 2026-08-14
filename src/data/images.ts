/**
 * ============================================================
 *  IMAGENS — registro central
 * ============================================================
 *
 *  Cada imagem pode ter até três arquivos, um por faixa de tela:
 *
 *    campo     | faixa de tela        | quando é usado
 *    ----------|----------------------|------------------------------------
 *    mobile    | até 639px            | celular
 *    tablet    | de 640px a 1023px    | tablet
 *    src       | 1024px ou mais       | desktop — é também o padrão de queda
 *
 *  Só `src` é obrigatório. Sem `mobile`/`tablet`, o navegador usa `src` em
 *  todas as telas — funciona, mas faz o celular baixar a imagem grande.
 *  O navegador escolhe UM arquivo e não baixa os outros.
 *
 *  COMO TROCAR UMA IMAGEM
 *  1. Substitua o arquivo em src/assets/ mantendo o mesmo nome
 *  2. Se as dimensões mudaram, atualize width/height aqui
 *
 *  COMO ADICIONAR UMA IMAGEM
 *  1. Coloque o arquivo em src/assets/ (nome em minúsculas, com hífens,
 *     sem espaços nem acentos — ex: banner-carreira.png)
 *  2. Acrescente um import no topo
 *  3. Acrescente uma entrada no objeto `images`
 *
 *  ⚠️  Sempre importe o arquivo — nunca escreva o caminho como texto
 *      ("/banner.png"). O import faz o Vite aplicar o subcaminho
 *      /landing-pages/ e adicionar hash de cache. Caminho escrito à mão
 *      funciona em npm run dev e dá 404 em produção.
 *
 *  ℹ️  width/height são as dimensões reais de CADA arquivo, em pixels. Servem
 *      para o navegador reservar o espaço certo antes da imagem carregar,
 *      evitando que o conteúdo "salte". A imagem continua responsiva — o CSS
 *      controla o tamanho exibido.
 */

import bannerCommunityTech from "@/assets/banner-community-tech.png";
import bannerCommunityTechMobile from "@/assets/banner-community-tech-mobile.png";
// Para ativar a versão de tablet, coloque o arquivo em src/assets/, descomente
// a linha abaixo e preencha o campo `tablet` da imagem:
// import bannerCommunityTechTablet from "@/assets/banner-community-tech-tablet.png";

export type ImageSource = {
  src: string;
  width: number;
  height: number;
};

export type ImageAsset = ImageSource & {
  /** Descrição para leitores de tela. Use "" se a imagem for puramente decorativa. */
  alt: string;
  /** Arquivo para celular (até 639px). */
  mobile?: ImageSource;
  /** Arquivo para tablet (640px a 1023px). */
  tablet?: ImageSource;
};

export const images = {
  /** Masthead no topo da página. */
  banner: {
    src: bannerCommunityTech,
    alt: "XPE Community /Tech",
    width: 1400,
    height: 467,
    mobile: { src: bannerCommunityTechMobile, width: 412, height: 138 },
    // tablet: { src: bannerCommunityTechTablet, width: 1024, height: 342 },
  },
} satisfies Record<string, ImageAsset>;

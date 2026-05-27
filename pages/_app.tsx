import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Layout from "@/components/Layout";

type AppComponentWithLayout = AppProps["Component"] & {
  noLayout?: boolean;
};

export default function App({ Component, pageProps }: AppProps) {
  const PageComponent = Component as AppComponentWithLayout;

  if (PageComponent.noLayout) {
    return <PageComponent {...pageProps} />;
  }

  return (
    <Layout>
      <PageComponent {...pageProps} />
    </Layout>
  );
}

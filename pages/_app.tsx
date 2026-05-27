import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import Layout from "@/components/Layout";
import { seedInitialData } from "@/lib/database";

type AppComponentWithLayout = AppProps["Component"] & {
  noLayout?: boolean;
};

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    seedInitialData().catch((error: unknown) => {
      console.error("Database initialization failed", error);
    });
  }, []);

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

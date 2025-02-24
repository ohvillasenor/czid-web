import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import { defaultTheme } from "@czi-sds/components";
import { ThemeProvider as EmotionThemeProvider } from "@emotion/react";
import { StyledEngineProvider, ThemeProvider } from "@mui/material/styles";
import * as Sentry from "@sentry/react";
import "font-awesome/scss/font-awesome.scss";
import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import "semantic-ui-css/semantic.min.css";
import "url-search-params-polyfill";
import { UserContext } from "~/components/common/UserContext";
import store from "~/redux/store";
import { initalCache, typeDefs } from "./cache";
import "./loader.scss";
import "./styles/appcues.scss";
import "./styles/core.scss";

// Sentry Basic Configuration Options: https://docs.sentry.io/platforms/javascript/guides/react/config/basics/
Sentry.init({
  dsn: window.SENTRY_DSN_FRONTEND,
  environment: window.ENVIRONMENT,
  release: window.GIT_RELEASE_SHA,
});

// eslint-disable-next-line @typescript-eslint/no-empty-function
if (!function f() {}.name) {
  // eslint-disable-next-line no-extend-native
  Object.defineProperty(Function.prototype, "name", {
    get: function() {
      const name = (this.toString().match(/^function\s*([^\s(]+)/) || [])[1];
      Object.defineProperty(this, "name", { value: name });
      return name;
    },
  });
}

const context = require.context("./components", true, /\.(js|jsx|ts|tsx)$/);
const foundComponents = {};
const contextKeys = context.keys();
contextKeys.forEach(key => {
  let a = null;
  if (typeof context(key) === "function") {
    a = context(key);
  } else if (typeof context(key) === "object") {
    a = context(key).default;
  }
  if (a && a.name) {
    foundComponents[a.name] = a;
  }
});

// Initialize Apollo for Rails Client
// This will be the default client passed in through the ApolloProvider
// It is used for all native GraphQL queries and mutations in the Rails app (e.g. app/graphql)
// TODO: (smccanny): delete this once rails and graphql are integrated under a single client
export const apolloClient = new ApolloClient({
  uri: "/graphql",
  cache: new InMemoryCache(),
});

// Initialize federated Apollo client with graphql endpoints
// Use this client for all federated queries and mutations (e.g. czid-graphql-federation-server)
export const federationClient = new ApolloClient({
  uri: "/graphqlfed",
  cache: initalCache,
  typeDefs,
});

// Turn off camelcase rule
/* eslint camelcase: 0 */
const react_component = (componentName, props, target, userContext) => {
  const matchedComponent = foundComponents[componentName];
  if (matchedComponent) {
    const root = createRoot(document.getElementById(target));
    root.render(
      <Sentry.ErrorBoundary fallback={"An error has occured"}>
        <BrowserRouter>
          <ApolloProvider client={apolloClient}>
            <UserContext.Provider value={userContext || {}}>
              <Provider store={store}>
                <StyledEngineProvider injectFirst>
                  <EmotionThemeProvider theme={defaultTheme}>
                    <ThemeProvider theme={defaultTheme}>
                      {React.createElement(matchedComponent, props)}
                    </ThemeProvider>
                  </EmotionThemeProvider>
                </StyledEngineProvider>
              </Provider>
            </UserContext.Provider>
          </ApolloProvider>
        </BrowserRouter>
      </Sentry.ErrorBoundary>,
    );
    if (userContext && userContext.userId) {
      Sentry.setUser({ id: userContext.userId });
    }
  } else {
    // eslint-disable-next-line no-console
    console.error(
      "Couldn't find component for",
      componentName,
      foundComponents,
    );
  }
};

window.react_component = react_component;

const { babelOptimizerPlugin } = require("@graphql-codegen/client-preset");

module.exports = {
  plugins: [
    "@emotion",
    transformImports(),
    [
      babelOptimizerPlugin,
      {
        artifactDirectory: "./app/assets/src/gql/generated",
        gqlTagName: "gql",
      },
    ],
  ],
};

function transformImports() {
  const muiPackages = ["core", "icons", "lab", "styles"];

  const transform = {};

  for (const muiPackage of muiPackages) {
    transform["@mui/" + muiPackage] = {
      preventFullImport: true,
      transform: `@mui/${muiPackage}/` + "${member}",
    };
  }

  return ["babel-plugin-transform-imports", transform];
}

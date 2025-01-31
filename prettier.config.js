/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 */
const config = {
  plugins: [require.resolve("prettier-plugin-tailwindcss")],
};

export default config;

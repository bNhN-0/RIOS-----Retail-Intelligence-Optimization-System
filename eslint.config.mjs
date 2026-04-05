import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    ignores: ["lib/navigation-hooks.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "next/navigation",
              importNames: [
                "useSearchParams",
                "usePathname",
                "useRouter",
                "useParams",
              ],
              message:
                "Wrap navigation-hook consumers in Suspense and centralize imports through reviewed shared components.",
            },
            {
              name: "@/i18n/navigation",
              importNames: ["usePathname", "useRouter"],
              message:
                "Wrap navigation-hook consumers in Suspense and centralize imports through reviewed shared components.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

import crypto from "node:crypto";
import { barplot, bench, boxplot, lineplot, run, summary } from "mitata";

const queryString =
	"?vk_user_id=494075&vk_app_id=6736218&vk_is_app_user=1&vk_are_notifications_enabled=1&vk_language=ru&vk_access_token_settings=&vk_platform=android&sign=htQFduJpLxz7ribXRZpDFUH-XEUhC9rBPTJkjUFEkRA";

const secretToken = "wvl68m4dR1UpLrVRli";
const IS_BUN = typeof Bun !== "undefined";

barplot(() => {
	summary(() => {
		bench("sha256", () => {
			crypto
				.createHmac("sha256", secretToken)
				.update(queryString)
				.digest("base64");
		});

		if (IS_BUN)
			bench("Bun.CryptoHasher", () => {
				new Bun.CryptoHasher("sha256", secretToken)
					.update(queryString)
					.digest("base64");
			});
		// bench("verifyLaunchParams", () => {
		// 	verifyLaunchParams(queryString, secretToken);
		// });
		// bench("parseLaunchParams", () => {
		// 	parseLaunchParams(queryString);
		// });
	});
});

await run();

// !NODE
// clk: ~3.99 GHz
// cpu: AMD Ryzen 7 7700 8-Core Processor
// runtime: node 22.10.0 (x64-win32)

// benchmark                   avg (min … max) p75   p99    (min … top 1%)
// ------------------------------------------- -------------------------------
// sha256                         1.62 µs/iter   1.55 µs  █
//                         (1.43 µs … 3.03 µs)   3.01 µs ▅█▅▁▁▂▁▁▁▁▁▁▁▁▁▁▁▁▁▂▂

// !BUN
// clk: ~2.58 GHz
// cpu: AMD Ryzen 7 7700 8-Core Processor
// runtime: bun 1.1.42 (x64-win32)

// benchmark                   avg (min … max) p75   p99    (min … top 1%)
// ------------------------------------------- -------------------------------
// sha256                         8.08 µs/iter   6.90 µs  █
//                        (5.30 µs … 11.84 ms)  33.00 µs ▃█▂▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁
// Bun.CryptoHasher             658.11 ns/iter 671.36 ns ▄    ██▃▃
//                     (615.36 ns … 808.11 ns) 766.21 ns ██▃▃▇████▄▄▂▃▁▁▁▂▁▁▁▁

// summary
//   Bun.CryptoHasher
//    12.28x faster than sha256

import crypto from "node:crypto";

/**
 * Верифицирует параметры запуска.
 */
export function verifyLaunchParams(
	queryStringRaw: string,
	secretKey: string,
): boolean {
	const urlParams = new URLSearchParams(queryStringRaw);
	const sign = urlParams.get("sign");

	if (!sign || urlParams.size === 0) return false;

	urlParams.delete("sign");

	const queryString = Array.from(urlParams.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
		.join("&");

	const paramsHash = crypto
		.createHmac("sha256", secretKey)
		.update(queryString)
		.digest()
		.toString("base64")
		// Why VK need this...
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=$/, "");

	return paramsHash === sign;
}

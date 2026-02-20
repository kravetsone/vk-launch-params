import { createHmac } from "node:crypto";
import type {
	LaunchParams,
	LaunchParamsGroupRole,
	LaunchParamsLanguages,
	LaunchParamsPlatforms,
} from "./types.ts";

const IS_BUN = typeof Bun !== "undefined";

// https://nodejs.org/api/buffer.html#buffer_buffers_and_character_encodings
// base64url нам подходит лучше чем предложенный ВКонтакте .digest().toString('base64').replace(...)
export const sha256Hash = IS_BUN
	? (hmacKey: string, input: string) =>
			new Bun.CryptoHasher("sha256", hmacKey).update(input).digest("base64url")
	: (hmacKey: string, input: string) =>
			createHmac("sha256", hmacKey).update(input).digest("base64url");

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

	return sha256Hash(secretKey, queryString) === sign;
}

/**
 * Парсит их из строки возвращая {@link LaunchParams}
 */
export function parseLaunchParams(queryStringRaw: string): LaunchParams {
	const urlParams = new URLSearchParams(queryStringRaw);

	const object = Object.fromEntries(urlParams.entries()) as Record<
		keyof LaunchParams,
		string
		// Это строка. их не надо преобразовывать
	> & {
		vk_language: LaunchParamsLanguages;
		vk_viewer_group_role?: LaunchParamsGroupRole;
		vk_platform: LaunchParamsPlatforms;
	};

	return {
		...object,
		vk_is_app_user: object.vk_is_app_user === "1",
		vk_are_notifications_enabled: object.vk_are_notifications_enabled === "1",
		vk_is_favorite: object.vk_is_favorite === "1",
		// Do we need solve NaN? only vk_group_id can be not present but in test data vk_ts missed too
		vk_ts: Number(object.vk_ts),
		vk_app_id: Number(object.vk_app_id),
		vk_user_id: Number(object.vk_user_id),
		vk_group_id: object.vk_group_id ? Number(object.vk_group_id) : undefined,
	} satisfies LaunchParams;
}

export function verifyAndParseLaunchParams(
	queryStringRaw: string,
	secretKey: string,
): LaunchParams | false {
	// TODO: optimize by reusing parsed queryStringRaw data
	return verifyLaunchParams(queryStringRaw, secretKey)
		? parseLaunchParams(queryStringRaw)
		: false;
}

/**
 * Генерирует подписанную строку параметров запуска VK Mini App.
 * Принимает объект параметров (без `sign`) и возвращает query-строку с вычисленным `sign`.
 */
export function signLaunchParams(
	params: Omit<LaunchParams, "sign">,
	secretKey: string,
): string {
	const urlParams = new URLSearchParams();

	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined)
			urlParams.set(
				key,
				typeof value === "boolean" ? (value ? "1" : "0") : String(value),
			);
	}

	const queryString = Array.from(urlParams.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
		.join("&");

	const sign = sha256Hash(secretKey, queryString);

	return `${queryString}&sign=${sign}`;
}

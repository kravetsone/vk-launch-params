import { describe, expect, it } from "bun:test";
import {
	parseLaunchParams,
	signLaunchParams,
	verifyAndParseLaunchParams,
	verifyLaunchParams,
} from "../src/index.ts";

const queryParams =
	"?vk_user_id=494075&vk_app_id=6736218&vk_is_app_user=1&vk_are_notifications_enabled=1&vk_language=ru&vk_access_token_settings=&vk_platform=android&sign=htQFduJpLxz7ribXRZpDFUH-XEUhC9rBPTJkjUFEkRA";
const clientSecret = "wvl68m4dR1UpLrVRli";

const queryParamsInvalid = `?vk_user_id=494075${2}&vk_app_id=6736218&vk_is_app_user=1&vk_are_notifications_enabled=1&vk_language=ru&vk_access_token_settings=&vk_platform=android&sign=htQFduJpLxz7ribXRZpDFUH-XEUhC9rBPTJkjUFEkRA`;

describe("test", () => {
	it("verifyLaunchParams - return true on valid", () => {
		const isValid = verifyLaunchParams(queryParams, clientSecret);

		expect(isValid).toBe(true);
	});

	it("verifyLaunchParams - return false on invalid", () => {
		const isValid = verifyLaunchParams(queryParamsInvalid, clientSecret);

		expect(isValid).toBe(false);
	});
});

describe("parseLaunchParams", () => {
	it("parseLaunchParams - return object", () => {
		const result = parseLaunchParams(queryParams);

		console.log(result);

		expect(typeof result).toBe("object");
	});
});

describe("verifyAndParseLaunchParams", () => {
	it("verifyAndParseLaunchParams - return object", () => {
		const result = verifyAndParseLaunchParams(
			queryParams,
			"wvl68m4dR1UpLrVRli",
		);

		expect(typeof result).toBe("object");
	});

	it("verifyAndParseLaunchParams - return false", () => {
		const result = verifyAndParseLaunchParams(
			queryParamsInvalid,
			"wvl68m4dR1UpLrVRli",
		);

		expect(result).toBe(false);
	});
});

describe("signLaunchParams", () => {
	it("produces a query string verifiable by verifyLaunchParams", () => {
		const params = {
			vk_user_id: 494075,
			vk_app_id: 6736218,
			vk_is_app_user: true,
			vk_are_notifications_enabled: true,
			vk_language: "ru" as const,
			vk_access_token_settings: "",
			vk_platform: "mobile_android" as const,
			vk_is_favorite: false,
			vk_ref: "other",
			vk_ts: 1234567890,
		};

		const signed = signLaunchParams(params, clientSecret);

		expect(verifyLaunchParams(signed, clientSecret)).toBe(true);
	});

	it("round-trips through verifyAndParseLaunchParams", () => {
		const params = {
			vk_user_id: 494075,
			vk_app_id: 6736218,
			vk_is_app_user: false,
			vk_are_notifications_enabled: false,
			vk_language: "en" as const,
			vk_access_token_settings: "",
			vk_platform: "desktop_web" as const,
			vk_is_favorite: true,
			vk_ref: "other",
			vk_ts: 1000000000,
		};

		const signed = signLaunchParams(params, clientSecret);
		const result = verifyAndParseLaunchParams(signed, clientSecret);

		expect(result).not.toBe(false);
		if (result) {
			expect(result.vk_user_id).toBe(params.vk_user_id);
			expect(result.vk_app_id).toBe(params.vk_app_id);
			expect(result.vk_language).toBe(params.vk_language);
			expect(result.vk_is_favorite).toBe(params.vk_is_favorite);
		}
	});

	it("different secrets produce different signatures", () => {
		const params = {
			vk_user_id: 1,
			vk_app_id: 1,
			vk_is_app_user: true,
			vk_are_notifications_enabled: false,
			vk_language: "ru" as const,
			vk_access_token_settings: "",
			vk_platform: "mobile_android" as const,
			vk_is_favorite: false,
			vk_ref: "other",
			vk_ts: 1,
		};

		const signed1 = signLaunchParams(params, "secret1");
		const signed2 = signLaunchParams(params, "secret2");

		expect(signed1).not.toBe(signed2);
		expect(verifyLaunchParams(signed1, "secret2")).toBe(false);
	});
});

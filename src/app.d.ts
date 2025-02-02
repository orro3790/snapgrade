// file: src/app.d.ts

import type User from "$lib/schemas/user";

declare global {
	namespace App {
		interface Locals {
			user?: ( User ) 
			settings?: ( Settings )
		}
		interface PageData {
			user?: Locals['user'];
			settings?: Locals['settings'];
		}
	}
}

export {};
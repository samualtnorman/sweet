declare module "console" as {
	log(value: any) null
}

import "console" as { log }

log(42)

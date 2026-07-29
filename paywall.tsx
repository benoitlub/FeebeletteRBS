kind = "mobile"
previewPath = "/"
title = "Blacklace Island"
version = "1.0.0"
id = "artifacts/blacklace-island"
router = "expo-domain"

[[integratedSkills]]
name = "expo"
version = "1.0.0"

[[services]]
ensurePreviewReachable = "/status"
name = "expo"
paths = [ "/" ]
localPort = 24193

[services.development]
run = "pnpm --filter @workspace/blacklace-island run dev"

[services.production]
build = [ "pnpm", "--filter", "@workspace/blacklace-island", "run", "build" ]
run = [ "pnpm", "--filter", "@workspace/blacklace-island", "run", "serve" ]

[services.env]
PORT = "24193"
BASE_PATH = "/"

## Twitter/X — @getmockline
Mockline is live 🚀

Upload an OpenAPI spec. Get an isolated mock API server. Instantly.

Built for dev teams tired of waiting on backend dependencies.

Free to start → https://mockline.xyz


## LinkedIn — Personal
I just launched Mockline.

The idea came from a problem I kept running into with frontend and QA teams getting blocked each sprint because the backend API wasn't ready. It's a bottleneck almost every software team faces.

So I built an open-source tool for it. You upload or design your OpenAPI spec in-app and get a fully isolated mock API server running in seconds. No extra configurations, no Docker setup, no extra logic.

Here's what it does:
• Parses any OpenAPI 3.x spec (YAML or JSON)  
• Spins up a real container with mock responses  
• Gives you a live URL to test against & share with your team immediately  
• Contract testing to verify your real API matches the spec  
• Schema diffing to catch breaking changes  
• In-dashboard API client for immediate testing

It's live today and free to start: https://mockline.xyz

If you work in engineering, QA, or product — I'd genuinely appreciate you trying it and telling me what breaks or what's missing.

#developer #api #openapi #devtools #startup


## Product Hunt
Name of launch: Mockline
Product Tagline: Turn API Specs into Live Mock Servers in 4 Seconds

Links to launch:
https://mockline.xyz
https://github.com/trillionclues/mockline

Is this an open source project? Yes

Description
What’s new or different about your launch compared to existing products? Which features make it stand out? 
Instant mock APIs from OpenAPI specs. Frontend and QA teams ship faster with isolated containers and live URLs—no backend blockers

Launch tags: api, openapi, devtools, startup

Write the first comment: 
Hi PH, I built Mockline, a tool that turns your OpenAPI 3.0 spec into an isolated, containerized mock server with a live public URL in ~4 seconds.

The problem: Frontend devs blocked waiting for backend APIs that exist on paper (the OpenAPI spec) but nowhere else.

Unlike Postman or SwaggerHub where you manually build mocks endpoint-by-endpoint, Mockline generates the entire server from your spec automatically. Each mock runs in its own Docker container (real isolation, no shared state), gets a unique HTTPS URL, and stays synced with your spec versions.

Shipped today:
• Instant provisioning (4s cold start) from YAML/JSON or remote URLs  
• True container isolation per spec version  
• Built-in contract testing (validate real APIs against specs)  
• Schema diffing to catch breaking changes  
• In-dashboard API client for immediate testing  
• Open source: github.com/trillionclues/mockline  

Mockline is perfect for engineering teams doing parallel development, QA writing integration tests against endpoints that don't exist yet, or PMs demoing features before backend is ready.

Genuinely curious, would you use this in your CI pipeline for integration tests, or is a 4s cold start too slow for that use case? Genuinely curious about your testing workflows.

Try it free → mockline.xyz


Hi PH! 👋

I kept getting blocked every sprint. Backend team would say "API is ready" but what they meant was the spec is ready. I was either building against hardcoded JSON that broke constantly, or waiting 2 weeks.

So I built the tool I wish existed: paste an OpenAPI spec or build one in-app, get a real HTTPS endpoint in 4 seconds. Not a "mock" that returns static files—a real container running a generated server that validates requests against your schema.

The thing I'm most proud of: Each mock is truly isolated (own Docker container), so you can test edge cases without worrying about state leaking between tests.

My question: For QAs doing automated testing—would you use this in CI if it took 4-5s to spin up per test suite? Or is that too slow? Trying to decide if I should optimize for cold starts or warm pools.

Open source repo: github.com/trillionclues/mockline
Try it: mockline.xyz

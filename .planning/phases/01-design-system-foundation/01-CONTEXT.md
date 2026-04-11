# Phase 1: Design System & Foundation - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Define visual identity in Google Stitch, scaffold the Astro 6 project with Tailwind 4 + React islands + shadcn/ui, wire design tokens into code, and set up Docker/K8s deployment pipeline. This is a formal design gate: visual identity must be approved before code beyond scaffolding.

</domain>

<decisions>
## Implementation Decisions

### Visual identity & mood
- Bold and energetic mood — vibrant colors, strong contrasts, dynamic feel (think KubeCon energy)
- Extract primary colors from the existing Cloud Native Days France logo
- Event photos from previous editions will be provided as atmosphere reference
- Typography and spacing: Claude's discretion, consistent with bold/energetic direction

### Geometric background patterns
- Claude's discretion on pattern style (hex mesh, abstract polygons, gradients + lines, etc.)
- Must complement the logo-derived color palette and bold/energetic mood

### Deployment setup
- Target domain: `2027.cloudnativedays.fr` initially (root `cloudnativedays.fr` later after 2026 site archival)
- Basic auth protection on the site until public event announcement
- K8s manifests live in `cnd-platform` repo (GitOps with Flux CD), NOT in the website repo
- Website repo contains only Dockerfile and build config
- Existing infra: NGINX ingress controller (`ingressClassName: public`), cert-manager with Let's Encrypt, Flux CD kustomizations
- Container image built via GitHub Actions on merge to main, pushed to GHCR (ghcr.io)
- Reference workflow for image builds: `Smana/cloud-native-ref` repo `.github/workflows/build-container-images.yml`

### Local testing with Dagger
- Use Dagger to provide a local build/test pipeline (build site, run in container, verify)
- Same pipeline can be reused in CI for consistency
- Allows contributors to test the full containerized site locally without manual Docker commands

### Claude's Discretion
- Geometric pattern style choice
- Typography selection (weight, family) within bold/energetic direction
- Spacing scale and component sizing
- shadcn/ui component selection and customization depth for initial baseline
- Nginx configuration details for the static site image
- Docker image optimization approach (target: under 50MB per success criteria)

</decisions>

<specifics>
## Specific Ideas

- Logo is the primary source of truth for brand colors — user will provide the logo file
- Event photos from previous edition will be provided as mood/atmosphere reference
- Existing GH Actions workflow in `Smana/cloud-native-ref` repo is the pattern to follow for CI
- Platform already runs Pretalx, Alfio, Baserow, Mattermost on the same cluster — website joins as a new workload
- Flux dependency chain pattern already established in `cnd-platform` repo (namespaces → sources → operators → workloads)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-design-system-foundation*
*Context gathered: 2026-04-11*

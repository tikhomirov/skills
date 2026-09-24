# Quick Audit — Project

A 5-minute shallow scan to find 3–5 improvement areas. Not a full audit.

## Step 1 — Read project context (≤ 1 min)

Open these files in parallel:

- `AGENTS.md` (or `README.md`) — project conventions and CI commands
- `composer.json` — Laravel / PHP / Livewire / Filament versions
- `bootstrap/app.php` — global middleware, commands
- `app/Providers/AppServiceProvider.php` — current essentials configuration

## Step 2 — Skim hot directories (≤ 2 min)

Pick 2–3 representative files from each:

- `app/Models/` — pick `User.php`, one hot model
- `app/Livewire/` — pick one list/edit component
- `app/Services/` — pick one service
- `app/Http/Controllers/` — pick one controller
- `tests/Feature/` — pick one feature test

Do not read everything. Skim signatures, properties, method bodies.

## Step 3 — Run 5 grep probes (≤ 1 min)

```bash
# 1. Mutability smell
grep -rn "use Carbon\\\\Carbon\b" app/                 # should be empty (only CarbonImmutable)

# 2. Mass-assignment smell
grep -rn '\$guarded = \[\]' app/Models/                # should be empty unless Unguard enabled

# 3. Lazy loading smell
grep -rn "DB::raw\|->raw(" app/                         # should be empty in app code
grep -rn "foreach" resources/views/ app/Livewire/      # inspect for missing eager load

# 4. Livewire security smell
grep -rn "public\s\+\(?int\|string\|bool\)" app/Livewire/  # public IDs without #[Locked]?
grep -rn "function mount" app/Livewire/ -A 15          # auth in mount()?

# 5. Test smell
grep -rn "catch\s*(\\\\\(Exception\|Throwable\)" app/Livewire/   # catches swallowing auth
grep -rn "sleep(\|Http::get(\|Http::post(" tests/      # real IO in tests?
```

## Step 4 — Score (≤ 30 s)

Use `16-point-checklist.md` to score. Mark only the obvious wins.

## Step 5 — Return shape

Return in this exact order:

```text
1. What I understood about the project
   — Stack: Laravel X / PHP Y / Livewire Z / etc.
   — Main features and modules
   — Notable conventions from AGENTS.md

2. Essentials readiness
   — X/16 (Y%)
   — top missing items: ...

3. Main improvement points
   — P0: ...
   — P1: ...
   — P2: ...

4. Why they matter
   — short reason per point

5. What I suggest doing first
   — one concrete next PR

6. Which recipes may help
   — recipes/strict-models.md
   — recipes/lw-locked.md
   — ...
```

If several options are equally useful, ask the user where to start. Do not start the work until they pick.

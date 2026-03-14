# test_realistic.py
from datetime import datetime, timedelta

from ml.scoring.algo import ELO
from ml.scoring.types import CommitData

now = datetime.now()


# Helper to create commits with proper spacing
def create_commit(
    hash: str, days_ago: float, msg: str, additions: int, deletions: int, stress: float
) -> CommitData:
    return {
        "hash": hash,
        "timestamp": now - timedelta(days=days_ago),
        "message": msg,
        "additions": additions,
        "deletions": deletions,
        "stressLevel": stress,
    }


# Based on the actual git log patterns
commits = [
    # Day 1 - Initial setup (small commits)
    create_commit("a1", 1.0, "initial commit", 50, 0, 0.28),
    create_commit("a2", 0.98, "added ml directory for the model", 30, 0, 0.05),
    create_commit("a3", 0.97, "re-setup", 100, 50, 0.68),  # Uncertain commit
    create_commit("a4", 0.96, "feat: initial commit", 200, 0, 0.15),
    create_commit("a5", 0.95, "feat: completed nav", 150, 20, 0.17),
    create_commit("a6", 0.94, "feat: footer complete", 80, 10, 0.28),
    create_commit(
        "a7", 0.93, "feat: scaffolded frontend route structures", 120, 0, 0.01
    ),
    create_commit("a8", 0.92, "run pnpm install", 5, 5, 0.06),
    create_commit("a9", 0.91, "feat: complete schema", 300, 0, 0.08),
    # Day 1 continued - Feature work
    create_commit("b1", 0.90, "feat: completed opening page", 250, 30, 0.16),
    create_commit("b2", 0.89, "resolved merge conflicts", 20, 20, 0.18),
    create_commit("b3", 0.88, "Merge pull request #1", 0, 0, 0.05),  # Merge commit
    # Day 2 - Fixes and tweaks
    create_commit("c1", 0.5, "re-run pnpm i to add modified dependencies", 10, 5, 0.02),
    create_commit("c2", 0.48, "feat: added routers for trpc backend", 180, 0, 0.01),
    create_commit("c3", 0.47, "feat: added direct url to prisma config", 15, 5, 0.01),
    create_commit("c4", 0.46, "fix: fixed build by changing the import", 30, 20, 0.16),
    create_commit(
        "c5", 0.45, "fix: added package.json postinstall script", 25, 10, 0.02
    ),
    create_commit("c6", 0.44, "fix: fixed deprecation package warning", 15, 15, 0.04),
    create_commit(
        "c7",
        0.43,
        "fix: remove cloudflare mentions to make deploying to vercel work",
        40,
        30,
        0.24,
    ),
    create_commit(
        "c8", 0.42, "fix: removed unneeded import causing lint error", 10, 10, 0.02
    ),
    create_commit("c9", 0.41, "fix: add vercel.json with correct presets", 35, 0, 0.13),
    create_commit(
        "c10", 0.40, "fix: added nitro plugin to allow vercel deployment", 45, 5, 0.12
    ),
    # Day 2 - Feature work
    create_commit("d1", 0.35, "setting up leaderboard page", 120, 0, 0.13),
    create_commit("d2", 0.34, "Merge branch 'main' into leaderboard-page", 0, 0, 0.08),
    # Your scoring algo commit (larger, uncertain)
    create_commit("e1", 0.3, "scoring algo", 500, 100, 0.68),  # Big ML commit
    # More merges and features
    create_commit("f1", 0.28, "Merge pull request #3", 0, 0, 0.04),
    create_commit("f2", 0.27, "feat: completed leaderboards table", 200, 50, 0.08),
    create_commit("f3", 0.26, "feat: leaderboards completed", 180, 40, 0.16),
    create_commit("f4", 0.25, "Merge branch 'main'", 0, 0, 0.08),
    create_commit("f5", 0.24, "fix: update prisma.config to use .env", 20, 10, 0.01),
    create_commit("f6", 0.23, "Merge pull request #4", 0, 0, 0.06),
    create_commit("f7", 0.22, "feat: branding change", 150, 80, 0.20),
]

# Run calculation
elo = ELO()
result = elo.calculate(commits)

print(f"Total commits analyzed: {len(commits)}")
print(f"ELO Delta: {result['eloDelta']}")

# Also show average per commit type
print(f"\nRepo aggregate stress (for reference): 0.1363")

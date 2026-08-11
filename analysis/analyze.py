"""
Decompose a weekly fantasy projection gap into roster quality vs schedule luck,
then test whether the gap is large enough to mean anything.

THE CORE IDEA
-------------
A weekly projection mixes two things that behave completely differently:

  roster quality  -- stable, carries across the whole season
  matchup effect  -- noise, resets every week

A league platform shows both numbers but never separates them:

  season average projection  =  roster quality
  this week's projection     =  roster quality + this week's matchup effect

So the matchup effect is just the difference:

  matchup_effect = week_projection - season_average

That subtraction is the entire method. Everything else is interpretation.

THE NOISE FLOOR
---------------
A gap only matters if it is large relative to how much scores bounce around.
Weekly fantasy team scores land near their projection with a standard deviation
around 17 points.

Two teams playing each other differ with a combined spread of:

    sqrt(17^2 + 17^2) = about 24 points

So a 12-point projected gap is half of one standard deviation. That team still
wins about 31% of the time. Ranks hide this; probabilities do not.

USAGE
-----
Numbers come from a CSV, not from code you edit. The file `league_week.csv` has
one row per team with columns:  team,week_proj,season_avg

  # analyze this week (ships with sample data, runs out of the box):
  python analyze.py

  # append this week's numbers to the season history, tagged as week N:
  python analyze.py --record --week 5

  # see how each team's roster-quality estimate has drifted over the season:
  python analyze.py --drift

  # run only the worked-example plumbing check:
  python analyze.py --check

Once the history file holds four or more weeks of *actual* scores (fill in the
`actual` column after each week is played), the script measures your league's own
weekly standard deviation and uses it in place of the 17.0 default. It prints
which value it used and why.
"""

import argparse
import math
import os

import pandas as pd


# ============================================================================
# CONFIGURATION
# ============================================================================
# Mark your own team. It must match a `team` value in the input CSV.
MY_TEAM = "Me"

# Files live next to this script so the tool works from any directory.
HERE = os.path.dirname(os.path.abspath(__file__))
INPUT_CSV = os.path.join(HERE, "league_week.csv")
HISTORY_CSV = os.path.join(HERE, "projection_history.csv")

# Fallback for how much a single team's weekly score bounces around, in points.
# 17 is a reasonable league-average figure. It is used only until the history
# file has enough real results to measure the true value for THIS league.
DEFAULT_WEEKLY_SD = 17.0

# A weekly standard deviation measured from very few weeks is itself noisy, so we
# do not trust an empirical figure until this many weeks of actual scores exist.
MIN_WEEKS_FOR_EMPIRICAL = 4


# ============================================================================
# INPUT -- LOAD THE CURRENT WEEK FROM A CSV
# ============================================================================


def load_league(path):
    """
    Read one week of the league from a CSV with columns team,week_proj,season_avg.

    season_avg is the per-game average projection (roster quality), not a season
    total. If the platform only shows a total, divide it by the number of
    regular-season games before putting it in the file.
    """
    frame = pd.read_csv(path)

    # Fail loudly on a malformed file rather than producing a confusing report
    # three functions later.
    required = {"team", "week_proj", "season_avg"}
    missing = required - set(frame.columns)
    if missing:
        raise ValueError(f"{path} is missing column(s): {', '.join(sorted(missing))}")

    return frame


# ============================================================================
# STEP 1 -- SPLIT EACH PROJECTION INTO ITS TWO PARTS
# ============================================================================


def decompose(frame):
    """
    Separate stable roster quality from this week's schedule, for every team.

    Adds two columns:
      roster   the season average -- what the team is worth in general
      matchup  week_proj - season_avg -- how much this week helps or hurts

    This is vectorized: the whole column is computed at once. The worked example
    recomputes one cell by hand and asserts it matches, so a broken refactor here
    trips an assertion instead of quietly corrupting the report.
    """
    frame = frame.copy()
    frame["roster"] = frame["season_avg"]
    frame["matchup"] = frame["week_proj"] - frame["season_avg"]
    return frame


# ============================================================================
# STEP 2 -- WIN PROBABILITY FROM A POINT GAP
# ============================================================================
# Two teams' scores are each uncertain. The difference between them is more
# uncertain than either alone -- variances add:
#
#     combined_sd = sqrt(sd_a^2 + sd_b^2)
#
# Then the chance the trailing team wins is the normal CDF of the gap divided
# by that combined spread. A gap of one combined_sd means about 16% to win.


def combined_spread(weekly_sd):
    return math.sqrt(2) * weekly_sd


def win_probability(point_gap, weekly_sd):
    """
    Probability the team that is `point_gap` points BEHIND still wins.
    A negative gap means you are ahead.
    """
    z = -point_gap / combined_spread(weekly_sd)
    # Normal CDF via the error function.
    return 0.5 * (1 + math.erf(z / math.sqrt(2)))


# ============================================================================
# STEP 3 -- IS THE GAP REAL OR IS IT NOISE?
# ============================================================================
# Express every gap in units of the combined spread. That number tells you
# far more than the raw points do.


def interpret(gap, weekly_sd):
    """Translate a point gap into plain language about whether it matters."""
    z = abs(gap) / combined_spread(weekly_sd)

    if z < 0.25:
        return f"noise ({z:.2f} sd) -- indistinguishable"
    if z < 0.5:
        return f"small ({z:.2f} sd) -- real but easily overcome"
    if z < 1.0:
        return f"moderate ({z:.2f} sd) -- a genuine disadvantage"
    return f"large ({z:.2f} sd) -- a structural gap"


# ============================================================================
# HISTORY -- MULTI-WEEK TRACKING
# ============================================================================
# The history file is a plain CSV, one row per team per week:
#   week,team,week_proj,season_avg,actual
# `actual` is left blank when a week is first recorded and filled in by hand
# once the games are played. Everything downstream reads from this one file.


def load_history(path):
    """Read the season history, or an empty frame with the right columns."""
    columns = ["week", "team", "week_proj", "season_avg", "actual"]
    if not os.path.exists(path):
        return pd.DataFrame(columns=columns)
    return pd.read_csv(path)


def record_week(input_frame, week, history_path):
    """
    Append this week's projections to the history, tagged with the week number.

    Re-recording the same week overwrites its rows rather than duplicating them,
    so the command is safe to run twice. Any `actual` scores already entered for
    that week are preserved -- recording projections must never wipe a result you
    typed in by hand.
    """
    history = load_history(history_path)

    # Remember actuals already entered for this week, keyed by team.
    preserved_actuals = {}
    if not history.empty:
        this_week = history[history["week"] == week]
        for _, row in this_week.iterrows():
            if pd.notna(row["actual"]):
                preserved_actuals[row["team"]] = row["actual"]

    new_rows = input_frame.loc[:, ["team", "week_proj", "season_avg"]].copy()
    new_rows.insert(0, "week", week)
    # Carry forward any preserved result; teams without one get a blank actual.
    new_rows["actual"] = new_rows["team"].map(preserved_actuals)

    # Drop this week's old rows, add the fresh ones, keep the file sorted.
    if not history.empty:
        history = history[history["week"] != week]
    combined = pd.concat([history, new_rows], ignore_index=True)
    combined = combined.sort_values(["week", "team"]).reset_index(drop=True)
    combined.to_csv(history_path, index=False)
    return combined


# ============================================================================
# EMPIRICAL WEEKLY STANDARD DEVIATION
# ============================================================================
# The win-probability model treats each team's actual score as a draw from
# Normal(this week's projection, sd^2). The standard deviation it needs is
# therefore the spread of (actual - week_proj) -- the projection residual --
# NOT the raw spread of scores. The raw spread would fold in the matchup swing
# and roster-quality differences and overstate the noise floor.
#
# We pool the residual across every scored team-week and take the sample
# standard deviation (ddof=1). Because the standard deviation is measured around
# the residual's own mean, a constant projection bias does not inflate it; we
# report that mean separately as a diagnostic.


def empirical_weekly_sd(history):
    """
    Return (sd, info) measured from the history, or (None, info) if there is not
    enough data. `info` always carries the number of scored weeks so the caller
    can explain its decision.
    """
    scored = history[history["actual"].notna()]
    scored_weeks = sorted(scored["week"].unique())

    if len(scored_weeks) < MIN_WEEKS_FOR_EMPIRICAL:
        return None, {"weeks": len(scored_weeks)}

    residual = scored["actual"] - scored["week_proj"]
    sd = residual.std(ddof=1)
    info = {
        "weeks": len(scored_weeks),
        "observations": len(residual),
        "mean_residual": residual.mean(),  # projection bias, for the record
    }
    return sd, info


def resolve_weekly_sd(history):
    """
    Decide which weekly SD to use and build a one-line explanation of why.
    Returns (weekly_sd, explanation).
    """
    sd, info = empirical_weekly_sd(history)

    if sd is None:
        explanation = (
            f"weekly SD = {DEFAULT_WEEKLY_SD:.1f} (default league-average) -- "
            f"history has {info['weeks']} week(s) of actual scores, "
            f"need {MIN_WEEKS_FOR_EMPIRICAL} to measure this league's own"
        )
        return DEFAULT_WEEKLY_SD, explanation

    bias = info["mean_residual"]
    bias_note = ""
    # A large mean residual means the platform's projections are systematically
    # off. The model assumes they are unbiased, so surface it and let the user
    # decide -- do not quietly correct for it.
    if abs(bias) >= 3.0:
        bias_note = (
            f"; heads up: projections ran {bias:+.1f} pts vs actual on average, "
            f"a bias the win-prob model assumes away"
        )

    explanation = (
        f"weekly SD = {sd:.1f} (measured from this league) -- "
        f"{info['observations']} team-weeks across {info['weeks']} weeks{bias_note}"
    )
    return sd, explanation


# ============================================================================
# WORKED EXAMPLE -- PLUMBING CHECK
# ============================================================================
# Recompute one team's numbers BY HAND, printing each step, then assert they
# match the vectorized DataFrame path. Run on every report, so a refactor that
# breaks the math trips an assertion here instead of silently shipping a wrong
# probability.


def worked_example(input_frame, weekly_sd):
    frame = decompose(input_frame)
    me = frame[frame["team"] == MY_TEAM].iloc[0]

    # Test the win-probability path against the strongest roster in the league
    # (fall back to any other team if that happens to be us).
    opponent = frame.loc[frame["roster"].idxmax()]
    if opponent["team"] == MY_TEAM:
        opponent = frame[frame["team"] != MY_TEAM].iloc[0]

    print("-" * 68)
    print("WORKED EXAMPLE (longhand, then checked against the vectorized path)")
    print("-" * 68)

    # (1) The decomposition: matchup = week projection - season average.
    hand_matchup = me["week_proj"] - me["season_avg"]
    print(
        f"  {MY_TEAM}: matchup = {me['week_proj']:.1f} - {me['season_avg']:.1f} "
        f"= {hand_matchup:+.1f}"
    )
    assert math.isclose(hand_matchup, me["matchup"]), "matchup decomposition mismatch"

    # (2) The combined spread: two independent teams, variances add.
    hand_spread = math.sqrt(2) * weekly_sd
    print(f"  combined spread = sqrt(2) * {weekly_sd:.1f} = {hand_spread:.1f}")
    assert math.isclose(hand_spread, combined_spread(weekly_sd)), "spread mismatch"

    # (3) Win probability against the opponent, one step at a time.
    gap = opponent["week_proj"] - me["week_proj"]
    z = -gap / hand_spread
    hand_p = 0.5 * (1 + math.erf(z / math.sqrt(2)))
    print(
        f"  vs {opponent['team']}: gap = {opponent['week_proj']:.1f} - "
        f"{me['week_proj']:.1f} = {gap:+.1f}"
    )
    print(f"    z = -({gap:+.1f}) / {hand_spread:.1f} = {z:+.3f}")
    print(f"    win prob = normal_cdf({z:+.3f}) = {hand_p:.1%}")
    assert math.isclose(hand_p, win_probability(gap, weekly_sd)), "win-prob mismatch"

    print("  all three match the vectorized path.")
    print()


# ============================================================================
# DRIFT -- HOW ROSTER-QUALITY ESTIMATES MOVE OVER THE SEASON
# ============================================================================
# season_avg is the platform's estimate of a roster's quality. It moves as the
# platform learns from results. Watching it drift separates two teams that look
# identical in the standings:
#
#   roster estimate RISING  -> the roster was underrated at draft. Real, persists.
#   roster estimate FLAT, but positive early matchup luck -> the team was carried
#                              by an easy early schedule. Resets; expect regression.


def show_drift(history):
    if history.empty:
        print("no history yet -- record some weeks first:")
        print("  python analyze.py --record --week 1")
        return

    weeks = sorted(history["week"].unique())
    first_week, last_week = weeks[0], weeks[-1]

    print("=" * 68)
    print("ROSTER-QUALITY DRIFT OVER THE SEASON")
    print("=" * 68)
    print(f"  weeks {first_week} through {last_week}")
    print()
    header = (
        f"  {'team':<16}{'roster wk' + str(first_week):>12}"
        f"{'roster wk' + str(last_week):>12}{'drift':>9}{'cum luck':>10}"
    )
    print(header)
    print("-" * 68)

    summaries = []
    for team, group in history.groupby("team"):
        group = group.sort_values("week")
        roster_start = group.iloc[0]["season_avg"]
        roster_now = group.iloc[-1]["season_avg"]
        drift = roster_now - roster_start
        # Cumulative schedule help: sum of every week's matchup effect.
        cumulative_luck = (group["week_proj"] - group["season_avg"]).sum()
        summaries.append((team, roster_start, roster_now, drift, cumulative_luck))

    # Biggest roster risers first -- those are the genuine improvers.
    for team, start, now, drift, luck in sorted(summaries, key=lambda s: -s[3]):
        print(f"  {team:<16}{start:>12.1f}{now:>12.1f}{drift:>+9.1f}{luck:>+10.1f}")

    print()
    print("  drift    = change in the roster-quality estimate (up = underrated at draft)")
    print("  cum luck = summed weekly matchup effect (positive = schedule has helped)")
    print()
    print("  High drift means the team improved for real. High cum luck but flat")
    print("  drift means the schedule carried it -- expect that team to regress.")


# ============================================================================
# REPORT
# ============================================================================


def report(input_frame, weekly_sd, sd_explanation):
    frame = decompose(input_frame)
    me = frame[frame["team"] == MY_TEAM].iloc[0]

    # State up front which noise floor we are using and why (empirical vs default).
    print(sd_explanation)
    print()

    print("=" * 68)
    print("ROSTER QUALITY vs MATCHUP LUCK")
    print("=" * 68)
    print(f"{'team':<22}{'week':>9}{'roster':>10}{'matchup':>10}")
    print("-" * 68)
    for _, r in frame.sort_values("roster", ascending=False).iterrows():
        star = " *" if r["team"] == MY_TEAM else "  "
        print(
            f"{r['team']:<22}{r['week_proj']:>9.1f}"
            f"{r['roster']:>10.1f}{r['matchup']:>+10.1f}{star}"
        )

    # --- your own split -----------------------------------------------------
    print()
    print("=" * 68)
    print("YOUR WEEK, SPLIT APART")
    print("=" * 68)
    print(f"  roster quality (season avg)   {me['roster']:>8.1f}")
    print(f"  this week's matchup effect    {me['matchup']:>+8.1f}")
    print(f"  {'-' * 30}")
    print(f"  this week's projection        {me['week_proj']:>8.1f}")

    # --- gap to the field ---------------------------------------------------
    best_roster = frame.loc[frame["roster"].idxmax()]
    best_week = frame.loc[frame["week_proj"].idxmax()]

    roster_gap = best_roster["roster"] - me["roster"]
    week_gap = best_week["week_proj"] - me["week_proj"]

    print()
    print("=" * 68)
    print("IS THE GAP REAL?")
    print("=" * 68)
    print(f"  combined spread for one matchup: {combined_spread(weekly_sd):.1f} pts")
    print()
    print(f"  gap to best ROSTER  ({best_roster['team']})")
    print(f"    {roster_gap:>+8.1f} pts   {interpret(roster_gap, weekly_sd)}")
    print(f"    -> this is the part that persists all season")
    print()
    print(f"  gap to best WEEK    ({best_week['team']})")
    print(f"    {week_gap:>+8.1f} pts   {interpret(week_gap, weekly_sd)}")
    print(f"    -> this includes schedule and resets next week")

    # Only decompose the weekly gap when there actually is one, so we never
    # divide by zero for a team that already owns the best projection.
    if week_gap != 0:
        schedule_portion = week_gap - roster_gap
        print()
        print(f"  of this week's {week_gap:.1f}-point gap:")
        print(f"    {roster_gap:>6.1f} is roster   ({roster_gap / week_gap:.0%})")
        print(f"    {schedule_portion:>6.1f} is schedule ({schedule_portion / week_gap:.0%})")

    # --- head to head -------------------------------------------------------
    print()
    print("=" * 68)
    print("WIN PROBABILITY IF YOU PLAYED EACH TEAM THIS WEEK")
    print("=" * 68)
    for _, r in frame.sort_values("week_proj", ascending=False).iterrows():
        if r["team"] == MY_TEAM:
            continue
        gap = r["week_proj"] - me["week_proj"]
        print(f"  vs {r['team']:<20}{win_probability(gap, weekly_sd):>7.1%}")

    # --- luck ranking -------------------------------------------------------
    print()
    print("=" * 68)
    print("WHO IS GETTING SCHEDULE HELP THIS WEEK")
    print("=" * 68)
    for _, r in frame.sort_values("matchup", ascending=False).iterrows():
        print(f"  {r['team']:<22}{r['matchup']:>+8.1f}")
    print()
    print("  Positive means favorable matchups inflate this week's number.")
    print("  It says nothing about how good the roster is.")


# ============================================================================
# COMMAND LINE
# ============================================================================


def main():
    parser = argparse.ArgumentParser(description="Fantasy projection gap analysis.")
    parser.add_argument("--input", default=INPUT_CSV, help="current-week CSV (team,week_proj,season_avg)")
    parser.add_argument("--history", default=HISTORY_CSV, help="multi-week history CSV")
    parser.add_argument("--record", action="store_true", help="append the input to the history")
    parser.add_argument("--week", type=int, help="week number to tag when recording")
    parser.add_argument("--drift", action="store_true", help="show roster-quality drift over the season")
    parser.add_argument("--check", action="store_true", help="run only the worked-example plumbing check")
    args = parser.parse_args()

    if args.record:
        if args.week is None:
            parser.error("--record needs --week N so the rows are tagged with a week")
        input_frame = load_league(args.input)
        record_week(input_frame, args.week, args.history)
        print(f"recorded week {args.week} ({len(input_frame)} teams) -> {args.history}")
        print("fill in the 'actual' column there once the week is played.")
        return

    if args.drift:
        show_drift(load_history(args.history))
        return

    input_frame = load_league(args.input)

    if args.check:
        worked_example(input_frame, DEFAULT_WEEKLY_SD)
        return

    # Normal report: pick the noise floor from the history, self-check the math,
    # then print the analysis.
    weekly_sd, sd_explanation = resolve_weekly_sd(load_history(args.history))
    worked_example(input_frame, weekly_sd)
    report(input_frame, weekly_sd, sd_explanation)


if __name__ == "__main__":
    main()

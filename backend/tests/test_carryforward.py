"""Unit tests for the liquid-balance series (no DB)."""
from app.services.carryforward import liquid_balance_series
from app.services.rollup import MONTH_NAMES


def make_chain(rows):
    """rows: list of (income, spent, invested) per month; chains carry forward from 0."""
    chain = []
    carry_in = 0.0
    for m, (inc, sp, inv) in enumerate(rows, start=1):
        net = inc - sp
        carry_out = carry_in + net
        chain.append(
            {
                "month": m,
                "month_name": MONTH_NAMES[m - 1],
                "carry_in": carry_in,
                "income": inc,
                "spent": sp,
                "invested": inv,
                "net": net,
                "carry_out": carry_out,
            }
        )
        carry_in = carry_out
    return chain


def test_actuals_are_carry_out_less_cumulative_invested():
    # Jan: +100k income, 40k spent, 20k invested; Feb: +100k, 50k, 10k
    chain = make_chain([(100000.0, 40000.0, 20000.0), (100000.0, 50000.0, 10000.0)] + [(0.0, 0.0, 0.0)] * 10)
    series = liquid_balance_series(chain, elapsed=2)

    assert series[0]["actual"] == 60000.0 - 20000.0            # carry_out 60k - invested 20k
    assert series[1]["actual"] == 110000.0 - 30000.0           # carry_out 110k - cum invested 30k
    assert series[2]["actual"] is None                         # future month


def test_projection_is_linear_from_last_elapsed_month():
    # Every elapsed month nets +30k liquid (100k in, 50k spent, 20k invested).
    chain = make_chain([(100000.0, 50000.0, 20000.0)] * 3 + [(0.0, 0.0, 0.0)] * 9)
    series = liquid_balance_series(chain, elapsed=3)

    last_actual = series[2]["actual"]
    assert last_actual == 90000.0                              # 3 * 30k
    # Projection connects at month 3 and grows by avg_net = 30k per month.
    assert series[2]["projected"] == last_actual
    assert series[3]["projected"] == last_actual + 30000.0
    assert series[11]["projected"] == last_actual + 9 * 30000.0
    assert series[1]["projected"] is None                      # before the join point


def test_elapsed_zero_all_none():
    chain = make_chain([(0.0, 0.0, 0.0)] * 12)
    series = liquid_balance_series(chain, elapsed=0)
    assert all(r["actual"] is None and r["projected"] is None for r in series)


def test_elapsed_twelve_no_projection():
    chain = make_chain([(10000.0, 5000.0, 1000.0)] * 12)
    series = liquid_balance_series(chain, elapsed=12)
    assert all(r["projected"] is None for r in series)
    assert all(r["actual"] is not None for r in series)


def test_negative_balances_pass_through():
    # Spending exceeds income: liquid balance goes negative and stays reported as-is.
    chain = make_chain([(10000.0, 30000.0, 0.0)] + [(0.0, 0.0, 0.0)] * 11)
    series = liquid_balance_series(chain, elapsed=1)
    assert series[0]["actual"] == -20000.0

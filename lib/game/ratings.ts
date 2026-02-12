/**
 * Glicko-2 Rating System Implementation
 * Based on the specifications by Mark Glickman
 * http://www.glicko.net/glicko/glicko2.pdf
 */

export interface Glicko2Player {
    rating: number;      // r
    rd: number;          // RD (Rating Deviation)
    volatility: number;  // sigma
}

export interface Glicko2Result {
    opponent: Glicko2Player;
    outcome: 1 | 0.5 | 0; // 1 = win, 0.5 = draw, 0 = loss
}

const SCALE_FACTOR = 173.7178;
const TAU = 0.5; // Constraints volatility changes. Configurable 0.3 to 1.2

function toGlicko2(player: Glicko2Player) {
    return {
        mu: (player.rating - 1500) / SCALE_FACTOR,
        phi: player.rd / SCALE_FACTOR,
        sigma: player.volatility
    };
}

function fromGlicko2(mu: number, phi: number, sigma: number): Glicko2Player {
    return {
        rating: mu * SCALE_FACTOR + 1500,
        rd: phi * SCALE_FACTOR,
        volatility: sigma
    };
}

function g(phi: number): number {
    return 1 / Math.sqrt(1 + 3 * (phi ** 2) / (Math.PI ** 2));
}

function E(mu: number, mu_j: number, phi_j: number): number {
    return 1 / (1 + Math.exp(-g(phi_j) * (mu - mu_j)));
}

/**
 * Calculates the new rating for a player after a series of games.
 * In our case, we usually process one game at a time.
 */
export function calculateNewRating(
    player: Glicko2Player,
    results: Glicko2Result[]
): Glicko2Player {
    const { mu, phi, sigma } = toGlicko2(player);

    if (results.length === 0) {
        // Player didn't play. Phi increases slightly (RD increases over time)
        const newPhi = Math.sqrt(phi ** 2 + sigma ** 2);
        return fromGlicko2(mu, newPhi, sigma);
    }

    let v_inv = 0;
    let delta_sum = 0;

    for (const res of results) {
        const opp = toGlicko2(res.opponent);
        const g_phi_j = g(opp.phi);
        const E_val = E(mu, opp.mu, opp.phi);

        v_inv += (g_phi_j ** 2) * E_val * (1 - E_val);
        delta_sum += g_phi_j * (res.outcome - E_val);
    }

    const v = 1 / v_inv;
    const delta = v * delta_sum;

    // Volatility update (Iterative algorithm)
    let a = Math.log(sigma ** 2);
    const f = (x: number) => {
        const ex = Math.exp(x);
        const phi_star = Math.sqrt(phi ** 2 + v + ex);
        const term1 = ex * (delta ** 2 - phi ** 2 - v - ex) / (2 * (phi ** 2 + v + ex) ** 2);
        const term2 = (x - a) / (TAU ** 2);
        return term1 - term2;
    };

    let A = a;
    let B: number;
    const epsilon = 0.000001;

    if (delta ** 2 > phi ** 2 + v) {
        B = Math.log(delta ** 2 - phi ** 2 - v);
    } else {
        let k = 1;
        while (f(a - k * TAU) < 0) k++;
        B = a - k * TAU;
    }

    let fA = f(A);
    let fB = f(B);

    while (Math.abs(B - A) > epsilon) {
        const C = A + (A - B) * fA / (fB - fA);
        const fC = f(C);
        if (fC * fB < 0) {
            A = B;
            fA = fB;
        } else {
            fA = fA / 2;
        }
        B = C;
        fB = fC;
    }

    const newSigma = Math.exp(A / 2);
    const phi_star = Math.sqrt(phi ** 2 + newSigma ** 2);
    const newPhi = 1 / Math.sqrt(1 / (phi_star ** 2) + 1 / v);
    const newMu = mu + (newPhi ** 2) * delta_sum;

    return fromGlicko2(newMu, newPhi, newSigma);
}

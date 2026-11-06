/**
 * Bangkok Rail Router
 *
 * Finds at most 2 shortest, sensible routes between any two stations in the network.
 * If an alternative route does not make practical sense compared to the first route,
 * only the 1st route is returned.
 *
 * Handles:
 *   - Single-line travel
 *   - Multi-line travel with interchanges
 *   - MRT Blue circular line (both directions)
 *   - Filtering nonsensical/redundant transfers and backtracking
 *
 * Output: array of 1 or 2 route objects, each containing an ordered list of steps.
 *
 * Usage (Node.js):
 *   node router.js "Rangsit" "Mo Chit"
 *
 * Usage (import):
 *   import { findRoutes } from './router.js';
 *   const routes = findRoutes("Rangsit", "Mo Chit");
 */

import { LINES, INTERCHANGES } from './railway_lines.js';

// ─────────────────────────────────────────────────────────────────────────────
// 0. PHYSICAL HUB MAPPING
//    Maps each "lineId::stationName" to its physical hub group.
//    Stations that are part of the same interchange share the same hub name.
// ─────────────────────────────────────────────────────────────────────────────

const STATION_TO_HUB = new Map();
for (const [hubName, connections] of Object.entries(INTERCHANGES)) {
    for (const [lineId, stationName] of connections) {
        STATION_TO_HUB.set(`${lineId}::${stationName}`, hubName);
    }
}
for (const [lineId, line] of Object.entries(LINES)) {
    for (const stationName of line.stations) {
        const key = `${lineId}::${stationName}`;
        if (!STATION_TO_HUB.has(key)) {
            STATION_TO_HUB.set(key, stationName);
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. BUILD GRAPH
//    Nodes  : "lineId::stationName"
//    Edges  : { to, cost, type }
//      type "ride"     — adjacent stations on the same line (cost 1)
//      type "transfer" — cross-line connection (cost 4, transfer penalty)
// ─────────────────────────────────────────────────────────────────────────────

function buildGraph(transferCost = 4) {
    const adj = new Map(); // node → [ {to, cost, type, line, stationName} ]

    function addEdge(a, b, meta) {
        if (!adj.has(a)) adj.set(a, []);
        if (!adj.has(b)) adj.set(b, []);
        adj.get(a).push({ to: b, ...meta });
        adj.get(b).push({ to: a, ...meta }); // undirected
    }

    // ── Ride edges: adjacent stations along each line ──────────────────────
    for (const [lineId, line] of Object.entries(LINES)) {
        const stations = line.stations;

        // MRT Blue is circular: detect if first === last, then wrap
        const isCircular =
            lineId === 'MRT_Blue' &&
            stations[0] === stations[stations.length - 1];

        const uniqueStations = isCircular ? stations.slice(0, -1) : stations;
        const len = uniqueStations.length;

        for (let i = 0; i < len; i++) {
            const curr = `${lineId}::${uniqueStations[i]}`;
            const next = `${lineId}::${uniqueStations[(i + 1) % (isCircular ? len : len - 1 + 1)]}`;

            if (!isCircular && i === len - 1) continue;

            addEdge(curr, next, {
                cost: 1,
                type: 'ride',
                line: lineId,
                stationName: uniqueStations[i],
            });
        }

        if (isCircular) {
            const first = `${lineId}::${uniqueStations[0]}`;
            const last  = `${lineId}::${uniqueStations[len - 1]}`;
            addEdge(first, last, {
                cost: 1,
                type: 'ride',
                line: lineId,
                stationName: uniqueStations[len - 1],
            });
        }
    }

    // ── Transfer edges: cross-line connections at interchanges ─────────────
    for (const [, connections] of Object.entries(INTERCHANGES)) {
        for (let i = 0; i < connections.length; i++) {
            for (let j = i + 1; j < connections.length; j++) {
                const nodeA = `${connections[i][0]}::${connections[i][1]}`;
                const nodeB = `${connections[j][0]}::${connections[j][1]}`;
                addEdge(nodeA, nodeB, {
                    cost: transferCost,
                    type: 'transfer',
                    line: null,
                    stationName: null,
                });
            }
        }
    }

    return adj;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. FIND START / END NODES
//    A user types a plain station name. Resolve it to all graph nodes that
//    match (a station can appear on multiple lines).
// ─────────────────────────────────────────────────────────────────────────────

function resolveStationNodes(stationName) {
    const matches = [];
    for (const [lineId, line] of Object.entries(LINES)) {
        if (line.stations.includes(stationName)) {
            matches.push(`${lineId}::${stationName}`);
        }
    }
    // Also check interchanges: the station might have an alias on another line
    for (const [, connections] of Object.entries(INTERCHANGES)) {
        for (const [lineId, name] of connections) {
            if (name === stationName) {
                const node = `${lineId}::${name}`;
                if (!matches.includes(node)) matches.push(node);
            }
        }
    }
    return matches;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. YEN'S K-SHORTEST PATHS (k = 3)
//    Standard implementation using Dijkstra as the inner shortest-path oracle.
//    Supports a multi-source / multi-sink setup: we add virtual source/sink
//    nodes connected to all real start/end nodes at zero cost.
// ─────────────────────────────────────────────────────────────────────────────

function dijkstra(adj, sources, targets) {
    /** Returns { dist, prev } from a set of source nodes. */
    const dist = new Map();
    const prev = new Map(); // node → { from, edgeMeta }
    const visited = new Set();

    // Min-heap via a simple sorted array (small graph — acceptable for ~200 nodes)
    const queue = []; // [ [cost, node] ]

    for (const src of sources) {
        dist.set(src, 0);
        queue.push([0, src]);
    }

    const enqueue = (cost, node) => {
        queue.push([cost, node]);
        queue.sort((a, b) => a[0] - b[0]);
    };

    while (queue.length > 0) {
        const [d, u] = queue.shift();
        if (visited.has(u)) continue;
        visited.add(u);

        if (!adj.has(u)) continue;
        for (const edge of adj.get(u)) {
            const v = edge.to;
            const nd = d + edge.cost;
            if (!dist.has(v) || nd < dist.get(v)) {
                dist.set(v, nd);
                prev.set(v, { from: u, edge });
                enqueue(nd, v);
            }
        }
    }

    // Find the cheapest reachable target
    let bestTarget = null;
    let bestCost = Infinity;
    for (const t of targets) {
        const c = dist.get(t) ?? Infinity;
        if (c < bestCost) { bestCost = c; bestTarget = t; }
    }

    return { dist, prev, bestTarget, bestCost };
}

function reconstructPath(prev, sources, target) {
    const path = [];
    let cur = target;
    while (cur !== undefined && !sources.has(cur)) {
        const info = prev.get(cur);
        if (!info) break;
        path.unshift({ node: cur, edge: info.edge });
        cur = info.from;
    }
    path.unshift({ node: cur, edge: null }); // source node
    return path;
}

function isValidPath(rawPath) {
    // 1. No consecutive transfers (cannot transfer without riding a train in between)
    for (let i = 1; i < rawPath.length; i++) {
        if (rawPath[i].edge?.type === 'transfer' && rawPath[i - 1].edge?.type === 'transfer') {
            return false;
        }
    }

    // 2. No visiting the same physical hub more than once (prevents loops & backtracking)
    const visitedHubs = [];
    for (let i = 0; i < rawPath.length; i++) {
        const hub = STATION_TO_HUB.get(rawPath[i].node);
        if (visitedHubs.length === 0 || visitedHubs[visitedHubs.length - 1] !== hub) {
            if (visitedHubs.includes(hub)) {
                return false;
            }
            visitedHubs.push(hub);
        }
    }

    return true;
}

function yenKShortest(adj, startNodes, endNodes, maxCandidates = 15) {
    /**
     * Yen's algorithm for k-shortest simple paths with transit path validation.
     * startNodes / endNodes are arrays of graph node strings.
     */
    const sourceSet = new Set(startNodes);
    const sinkSet   = new Set(endNodes);

    // Initial shortest path
    const { prev, bestTarget, bestCost } = dijkstra(adj, startNodes, endNodes);
    if (bestTarget === null) return []; // no path

    const firstPath = reconstructPath(prev, sourceSet, bestTarget);
    const validPaths = [];
    if (isValidPath(firstPath)) {
        validPaths.push({ path: firstPath, cost: bestCost });
    }

    const A = [{ path: firstPath, cost: bestCost }];
    const B = []; // candidates

    for (let k = 1; k < maxCandidates; k++) {
        if (!A[k - 1]) break;
        const prevPath = A[k - 1].path;

        for (let i = 0; i < prevPath.length - 1; i++) {
            const spurNode = prevPath[i].node;
            const rootPath = prevPath.slice(0, i + 1);
            const rootNodes = new Set(rootPath.map(s => s.node));

            // Build a modified graph:
            //  - Remove edges that are part of any A[j] path sharing the same root
            //  - Remove root nodes (except spurNode) to force simple paths
            const removedEdges = new Set();

            for (const { path: aPath } of A) {
                if (aPath.length > i) {
                    const aRoot = aPath.slice(0, i + 1).map(s => s.node);
                    const rootMatch = rootPath.every((r, idx) => r.node === aRoot[idx]);
                    if (rootMatch && aPath.length > i + 1) {
                        removedEdges.add(`${aPath[i].node}|||${aPath[i + 1].node}`);
                        removedEdges.add(`${aPath[i + 1].node}|||${aPath[i].node}`);
                    }
                }
            }

            // Modified adjacency: skip removed edges and root nodes (except spurs)
            const modAdj = new Map();
            for (const [u, edges] of adj.entries()) {
                if (rootNodes.has(u) && u !== spurNode) continue;
                const filtered = edges.filter(e => {
                    if (rootNodes.has(e.to) && e.to !== spurNode) return false;
                    const key = `${u}|||${e.to}`;
                    return !removedEdges.has(key);
                });
                if (filtered.length > 0) modAdj.set(u, filtered);
            }

            // Dijkstra from spurNode in modified graph
            const { prev: sPrev, bestTarget: sBest, bestCost: sCost } =
                dijkstra(modAdj, [spurNode], [...sinkSet]);

            if (sBest === null) continue;

            const spurPath = reconstructPath(sPrev, new Set([spurNode]), sBest);
            if (i > 0) {
                spurPath[0].edge = rootPath[i].edge;
            }
            const fullPath = [...rootPath.slice(0, i), ...spurPath];

            // Cost = root cost + spur cost
            const rootCost = rootPath.length > 1
                ? rootPath.slice(1).reduce((acc, step) => acc + (step.edge?.cost ?? 0), 0)
                : 0;
            const totalCost = rootCost + sCost;

            // Avoid duplicate candidates
            const pathStr = fullPath.map(s => s.node).join('|');
            const isDup = B.some(c => c.path.map(s => s.node).join('|') === pathStr)
                       || A.some(c => c.path.map(s => s.node).join('|') === pathStr);
            if (!isDup) {
                B.push({ path: fullPath, cost: totalCost });
            }
        }

        if (B.length === 0) break;
        B.sort((a, b) => a.cost - b.cost);
        const nextBest = B.shift();
        A.push(nextBest);
        if (isValidPath(nextBest.path)) {
            validPaths.push(nextBest);
        }
    }

    return validPaths;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. FORMAT ROUTE
//    Convert a raw node-path into a human-readable route array.
// ─────────────────────────────────────────────────────────────────────────────

function formatRoute(rawPath) {
    /**
     * Returns an array of steps:
     * {
     *   type:        "ride" | "transfer"
     *   line:        string (lineId)  — for ride steps
     *   stations:    string[]          — ordered stations traversed on this segment
     *   from:        string            — display name of segment start
     *   to:          string            — display name of segment end
     *   stops:       number            — number of stops ridden
     * }
     */
    if (!rawPath || rawPath.length === 0) return [];

    const steps = [];
    let segmentLine = null;
    let segmentStations = [];

    const flush = () => {
        if (segmentStations.length >= 2) {
            steps.push({
                type:     'ride',
                line:     segmentLine,
                stations: [...segmentStations],
                from:     segmentStations[0],
                to:       segmentStations[segmentStations.length - 1],
                stops:    segmentStations.length - 1,
            });
        }
        segmentLine = null;
        segmentStations = [];
    };

    for (let i = 0; i < rawPath.length; i++) {
        const { node, edge } = rawPath[i];
        const [lineId, stationName] = node.split('::');

        if (i === 0) {
            segmentLine = lineId;
            segmentStations.push(stationName);
            continue;
        }

        if (edge && edge.type === 'transfer') {
            // Close the current ride segment, then add a transfer step
            flush();
            const [nextLineId, nextStationName] = rawPath[i].node.split('::');
            const prevStationName = rawPath[i - 1].node.split('::')[1];
            const prevLineId      = rawPath[i - 1].node.split('::')[0];
            // Only emit a transfer step if there's an actual line change
            if (prevLineId !== nextLineId || prevStationName !== nextStationName) {
                steps.push({
                    type:     'transfer',
                    from:     prevStationName,
                    to:       nextStationName,
                    fromLine: prevLineId,
                    toLine:   nextLineId,
                });
            }
            segmentLine = nextLineId;
            segmentStations.push(nextStationName);
        } else {
            // Same line → continue segment
            if (lineId !== segmentLine) {
                // Shouldn't happen if graph is built correctly, but be defensive
                flush();
                segmentLine = lineId;
            }
            segmentStations.push(stationName);
        }
    }

    flush();
    return steps;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. ROUTE PRUNING & REASONABILITY FILTER
//    Selects up to K distinct, sensible routes. An alternative route is only
//    accepted if it offers a genuine, practical corridor without unnecessary
//    micro-detours, backtracking, or excessive transfers.
// ─────────────────────────────────────────────────────────────────────────────

function selectSensibleRoutes(candidates, maxRoutes = 3) {
    if (candidates.length === 0) return [];

    const bestRoute = candidates[0];
    const bestStops = bestRoute.steps.filter(s => s.type === 'ride').reduce((acc, s) => acc + s.stops, 0);
    const bestCost = bestRoute.cost;
    const isBestDirect = bestRoute.transfers === 0;

    const acceptedRoutes = [bestRoute];
    const acceptedLineSequences = new Set();
    acceptedLineSequences.add(bestRoute.steps.filter(s => s.type === 'ride').map(s => s.line).join('->'));

    for (let i = 1; i < candidates.length; i++) {
        if (acceptedRoutes.length >= maxRoutes) break;
        const candidate = candidates[i];
        const candStops = candidate.steps.filter(s => s.type === 'ride').reduce((acc, s) => acc + s.stops, 0);

        // 1. Transfer limits: at most 3 transfers total, and at most 1 more transfer than best route
        if (candidate.transfers > 3) continue;
        if (candidate.transfers > bestRoute.transfers + 1) continue;

        // 2. Cost threshold: cannot be grossly higher than the best route
        if (candidate.cost > Math.max(bestCost * 1.5, bestCost + 14)) continue;

        // 3. Direct line protection: if best route is direct (0 transfers),
        // do not suggest multi-transfer detour routes
        if (isBestDirect && candidate.transfers > 0) continue;

        // 4. Line sequence checks:
        const rideSteps = candidate.steps.filter(s => s.type === 'ride');
        const linesUsed = rideSteps.map(s => s.line);

        // 4a. No re-entering an already departed line (e.g. Line A -> Line B -> Line A)
        const seenLines = new Set();
        let hasLineReentry = false;
        for (let l = 0; l < linesUsed.length; l++) {
            const line = linesUsed[l];
            if (l > 0 && line !== linesUsed[l - 1] && seenLines.has(line)) {
                hasLineReentry = true;
                break;
            }
            seenLines.add(line);
        }
        if (hasLineReentry) continue;

        // 4b. No identical line sequence to an already accepted route (prevents 1-station interchange shifts)
        const seqKey = linesUsed.join('->');
        if (acceptedLineSequences.has(seqKey)) continue;

        // 5. No micro-ride: boarding a train line for only 1 stop between transfers
        // (unless line is BTS_Gold, or the entire route is only 1 stop)
        let hasMicroRide = false;
        if (rideSteps.length > 1) {
            for (let s = 0; s < candidate.steps.length; s++) {
                const step = candidate.steps[s];
                if (step.type === 'ride' && step.stops === 1 && step.line !== 'BTS_Gold') {
                    if (s > 0 && candidate.steps[s - 1]?.type === 'transfer') {
                        hasMicroRide = true;
                        break;
                    }
                    if (s < candidate.steps.length - 1 && candidate.steps[s + 1]?.type === 'transfer') {
                        hasMicroRide = true;
                        break;
                    }
                }
            }
        }
        if (hasMicroRide) continue;

        // 6. Stop count sanity: alternative shouldn't have drastically more stops (max 1.6x)
        if (candStops > bestStops * 1.6) continue;

        // Passed all checks: valid sensible alternative!
        acceptedRoutes.push(candidate);
        acceptedLineSequences.add(seqKey);
    }

    return acceptedRoutes;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

const GRAPH = buildGraph(4);

/**
 * Find up to 3 shortest, sensible routes between two stations.
 * Only returns alternative routes if they offer a distinct, practical corridor.
 *
 * @param {string} startStation - Plain station name (e.g. "Rangsit")
 * @param {string} endStation   - Plain station name (e.g. "Suvarnabhumi (Airport)")
 * @param {number} maxRoutes    - Maximum routes to return (default: 3)
 * @returns {Array} Array of route objects, shortest first.
 *   Each route: { cost, transfers, steps: [...] }
 */
export function findRoutes(startStation, endStation, maxRoutes = 3) {
    const startNodes = resolveStationNodes(startStation);
    const endNodes   = resolveStationNodes(endStation);

    if (startNodes.length === 0) {
        throw new Error(`Station not found: "${startStation}"`);
    }
    if (endNodes.length === 0) {
        throw new Error(`Station not found: "${endStation}"`);
    }
    if (startStation === endStation) {
        return [{
            cost: 0, transfers: 0,
            steps: [{ type: 'ride', line: startNodes[0].split('::')[0],
                       stations: [startStation], from: startStation,
                       to: startStation, stops: 0 }],
        }];
    }

    const rawCandidates = yenKShortest(GRAPH, startNodes, endNodes, 30);
    const formattedCandidates = rawCandidates.map(({ path, cost }) => {
        const steps = formatRoute(path);
        const transfers = steps.filter(s => s.type === 'transfer').length;
        return { cost, transfers, steps };
    });

    return selectSensibleRoutes(formattedCandidates, maxRoutes);
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. PRETTY-PRINT HELPER (for CLI / debug)
// ─────────────────────────────────────────────────────────────────────────────

export function printRoutes(startStation, endStation) {
    let routes;
    try {
        routes = findRoutes(startStation, endStation);
    } catch (e) {
        console.error(`Error: ${e.message}`);
        return;
    }

    if (routes.length === 0) {
        console.log(`No route found between "${startStation}" and "${endStation}".`);
        return;
    }

    console.log(`\nRoutes from "${startStation}" → "${endStation}"\n`);

    routes.forEach((route, idx) => {
        const rideStops = route.steps
            .filter(s => s.type === 'ride')
            .reduce((acc, s) => acc + s.stops, 0);
        console.log(`── Route ${idx + 1}  (${rideStops} stop${rideStops !== 1 ? 's' : ''}, ${route.transfers} transfer${route.transfers !== 1 ? 's' : ''})`);

        for (const step of route.steps) {
            if (step.type === 'ride') {
                const lineLabel = step.line.replace('_', ' ');
                console.log(`   🚉 [${lineLabel}]  ${step.from}  →  ${step.to}  (${step.stops} stop${step.stops !== 1 ? 's' : ''})`);
                console.log(`      Stations: ${step.stations.join(' → ')}`);
            } else {
                console.log(`   🔄 Transfer: ${step.from} (${step.fromLine.replace('_', ' ')})  →  ${step.to} (${step.toLine.replace('_', ' ')})`);
            }
        }
        console.log();
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. CLI ENTRY POINT
//    node router.js "Mo Chit" "Sala Daeng"
// ─────────────────────────────────────────────────────────────────────────────

if (typeof process !== 'undefined' && process.argv[1]?.endsWith('router.js')) {
    const [,, start, end] = process.argv;
    if (!start || !end) {
        console.log('Usage: node router.js "<Start Station>" "<End Station>"');
        process.exit(1);
    }
    printRoutes(start, end);
}

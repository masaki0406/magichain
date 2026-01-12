import { WORLD_MAP, PathType } from './map';

export interface Ticket {
    type: PathType;
    count: number;
}

export interface MoveResult {
    destinations: string[];
}

/**
 * Calculates reachable nodes from a start node given a set of tickets (optional).
 * For basic movement (1 action = 1 step), tickets are not consumed but checked if required.
 * In Eldritch Horror, 1 Move Action allows moving 1 space along any path.
 * If you have tickets, you can move additional spaces.
 * 
 * For this implementation, we assume:
 * - Base move: 1 step (always allowed if connected)
 * - Additional moves: Require tickets matching the path type.
 */
export function getReachableNodes(
    startNodeId: string,
    tickets: Ticket[] = []
): string[] {
    const reachable = new Set<string>();
    // const queue: { id: string; depth: number }[] = [{ id: startNodeId, depth: 0 }];

    // Basic implementation: Only 1 step for now as per basic action
    // TODO: Implement multi-step movement with tickets

    const startNode = WORLD_MAP[startNodeId];
    if (!startNode) return [];

    // 1. Basic Move (Depth 1)
    for (const conn of startNode.connections) {
        reachable.add(conn.targetId);
    }

    // TODO: Add logic for using tickets to extend range

    return Array.from(reachable);
}

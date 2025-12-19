import {CombinedVisitorAdapter, OpenApi20Response, OpenApi30Response} from "@apicurio/data-models";
import {isDefinition} from "./visitor-utils";

/**
 * Visitor used to find schema definitions.
 */
export class FindResponseDefinitionsVisitor extends CombinedVisitorAdapter {

    responseDefinitions: (OpenApi20Response|OpenApi30Response)[] = [];

    /**
     * C'tor.
     * @param filterCriteria
     */
    constructor(private filterCriteria: string) {
        super();
    }

    /**
     * Called when a response definition is visited.
     * @param node
     */
    visitResponse(node: OpenApi20Response | OpenApi30Response): void {
        if (isDefinition(node)) {
            let name: string = node.mapPropertyName();
            if (this.acceptThroughFilter(name)) {
                this.responseDefinitions.push(node);
            }
        }
    }

    /**
     * Sorts and returns the responses.
     */
    public getSortedResponses(): (OpenApi20Response | OpenApi30Response)[] {
        return this.responseDefinitions.sort( (def1, def2) => {
            let name1: string = def1.mapPropertyName();
            let name2: string = def2.mapPropertyName();
            return name1.localeCompare(name2);
        });
    }

    /**
     * Returns true if the given name is accepted by the current filter criteria.
     * @param name
     */
    private acceptThroughFilter(name: string): boolean {
        //console.info("Accepting: %s through filter: %s", name, this.filterCriteria);
        if (this.filterCriteria === null) {
            return true;
        }
        return name.toLowerCase().indexOf(this.filterCriteria) !== -1;
    }

}

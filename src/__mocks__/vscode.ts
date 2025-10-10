/**
 * Mock implementation of VSCode API for testing
 */

export class ThemeIcon {
    constructor(public id: string, public color?: ThemeColor) {}
}

export class ThemeColor {
    constructor(public id: string) {}
}

export class MarkdownString {
    private _value: string = '';

    appendMarkdown(value: string): MarkdownString {
        this._value += value;
        return this;
    }

    get value(): string {
        return this._value;
    }
}

export class TreeItem {
    constructor(
        public label: string,
        public collapsibleState?: TreeItemCollapsibleState
    ) {}

    iconPath?: any;
    description?: string;
    tooltip?: string | MarkdownString;
    command?: any;
    contextValue?: string;
}

export enum TreeItemCollapsibleState {
    None = 0,
    Collapsed = 1,
    Expanded = 2
}

export class EventEmitter<T> {
    private listeners: Array<(e: T) => any> = [];

    get event() {
        return (listener: (e: T) => any) => {
            this.listeners.push(listener);
            return { dispose: () => {} };
        };
    }

    fire(data: T): void {
        this.listeners.forEach(listener => listener(data));
    }

    dispose(): void {
        this.listeners = [];
    }
}

export namespace window {
    export function showErrorMessage(message: string): Thenable<string | undefined> {
        return Promise.resolve(undefined);
    }

    export function showInformationMessage(message: string): Thenable<string | undefined> {
        return Promise.resolve(undefined);
    }

    export function showInputBox(options?: any): Thenable<string | undefined> {
        return Promise.resolve(undefined);
    }
}

export namespace workspace {
    export function getConfiguration(section?: string): any {
        return {
            get: (key: string, defaultValue?: any) => defaultValue,
            update: () => Promise.resolve()
        };
    }
}

export namespace commands {
    export function registerCommand(command: string, callback: (...args: any[]) => any): any {
        return { dispose: () => {} };
    }
}

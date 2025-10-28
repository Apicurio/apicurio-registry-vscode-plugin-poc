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

export enum ProgressLocation {
    SourceControl = 1,
    Window = 10,
    Notification = 15
}

export enum ViewColumn {
    Active = -1,
    Beside = -2,
    One = 1,
    Two = 2,
    Three = 3,
    Four = 4,
    Five = 5,
    Six = 6,
    Seven = 7,
    Eight = 8,
    Nine = 9
}

export namespace window {
    export function showErrorMessage(message: string, ...items: string[]): Thenable<string | undefined> {
        return Promise.resolve(undefined);
    }

    export function showInformationMessage(message: string, ...items: string[]): Thenable<string | undefined> {
        return Promise.resolve(undefined);
    }

    export function showInputBox(options?: any): Thenable<string | undefined> {
        return Promise.resolve(undefined);
    }

    export function showQuickPick(items: any[] | Thenable<any[]>, options?: any): Thenable<any | undefined> {
        return Promise.resolve(undefined);
    }

    export function withProgress<R>(
        options: { location: ProgressLocation; title?: string; cancellable?: boolean },
        task: (progress: { report(value: { message?: string; increment?: number }): void }) => Thenable<R>
    ): Thenable<R> {
        const progress = {
            report: (_value: { message?: string; increment?: number }) => {}
        };
        return task(progress);
    }

    export function showTextDocument(document: any, options?: any): Thenable<any> {
        return Promise.resolve({});
    }
}

export namespace workspace {
    export function getConfiguration(section?: string): any {
        return {
            get: (key: string, defaultValue?: any) => defaultValue,
            update: () => Promise.resolve()
        };
    }

    export function openTextDocument(options: { content: string; language?: string } | string): Thenable<any> {
        return Promise.resolve({
            getText: () => typeof options === 'string' ? '' : options.content,
            languageId: typeof options === 'string' ? 'plaintext' : (options.language || 'plaintext')
        });
    }
}

export namespace commands {
    export function registerCommand(command: string, callback: (...args: any[]) => any): any {
        return { dispose: () => {} };
    }
}

export namespace env {
    export const clipboard = {
        writeText: (value: string): Thenable<void> => Promise.resolve(),
        readText: (): Thenable<string> => Promise.resolve('')
    };
}

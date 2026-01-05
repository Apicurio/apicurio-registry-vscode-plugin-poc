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

export class Uri {
    static file(path: string): Uri {
        return new Uri('file', '', path);
    }

    static parse(value: string): Uri {
        const match = value.match(/^([^:]+):\/\/(.*)$/);
        if (match) {
            return new Uri(match[1], '', match[2]);
        }
        return new Uri('file', '', value);
    }

    static from(components: { scheme: string; path: string }): Uri {
        return new Uri(components.scheme, '', components.path);
    }

    constructor(public scheme: string, public authority: string, public path: string) {}

    get fsPath(): string {
        return this.path;
    }

    toString(): string {
        return `${this.scheme}://${this.path}`;
    }
}

export namespace window {
    export function showErrorMessage(message: string, ...items: string[]): Thenable<string | undefined> {
        return Promise.resolve(undefined);
    }

    export function showInformationMessage(message: string, ...items: string[]): Thenable<string | undefined> {
        return Promise.resolve(undefined);
    }

    export function showWarningMessage(message: string, ...items: any[]): Thenable<string | undefined> {
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

    export function showSaveDialog(options?: { defaultUri?: Uri; filters?: Record<string, string[]>; saveLabel?: string }): Thenable<Uri | undefined> {
        return Promise.resolve(undefined);
    }

    export function showOpenDialog(options?: { canSelectFiles?: boolean; canSelectFolders?: boolean; canSelectMany?: boolean; filters?: Record<string, string[]>; openLabel?: string }): Thenable<Uri[] | undefined> {
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

    export function openTextDocument(options: { content: string; language?: string } | string): Thenable<any> {
        return Promise.resolve({
            getText: () => typeof options === 'string' ? '' : options.content,
            languageId: typeof options === 'string' ? 'plaintext' : (options.language || 'plaintext')
        });
    }

    export const fs = {
        writeFile: (uri: Uri, content: Uint8Array): Thenable<void> => Promise.resolve(),
        readFile: (uri: Uri): Thenable<Uint8Array> => Promise.resolve(new Uint8Array())
    };
}

export namespace commands {
    export function registerCommand(command: string, callback: (...args: any[]) => any): any {
        return { dispose: () => {} };
    }

    export function executeCommand(command: string, ...args: any[]): Thenable<any> {
        return Promise.resolve();
    }
}

export namespace env {
    export const clipboard = {
        writeText: (value: string): Thenable<void> => Promise.resolve(),
        readText: (): Thenable<string> => Promise.resolve('')
    };
}

export enum DiagnosticSeverity {
    Error = 0,
    Warning = 1,
    Information = 2,
    Hint = 3
}

export class Range {
    constructor(
        public start: Position,
        public end: Position
    ) {}

    static create(startLine: number, startCharacter: number, endLine: number, endCharacter: number): Range {
        return new Range(new Position(startLine, startCharacter), new Position(endLine, endCharacter));
    }
}

export class Position {
    constructor(
        public line: number,
        public character: number
    ) {}
}

export class Diagnostic {
    constructor(
        public range: Range,
        public message: string,
        public severity?: DiagnosticSeverity
    ) {}

    source?: string;
    code?: string | number;
}

export namespace languages {
    const diagnosticCollections = new Map<string, DiagnosticCollection>();

    export function createDiagnosticCollection(name?: string): DiagnosticCollection {
        const collection = new DiagnosticCollectionImpl(name || 'default');
        diagnosticCollections.set(name || 'default', collection);
        return collection;
    }

    export function getDiagnostics(uri: Uri): Diagnostic[] {
        return [];
    }
}

export interface DiagnosticCollection {
    name: string;
    set(uri: Uri, diagnostics: Diagnostic[] | undefined): void;
    delete(uri: Uri): void;
    clear(): void;
    dispose(): void;
    get(uri: Uri): Diagnostic[] | undefined;
}

class DiagnosticCollectionImpl implements DiagnosticCollection {
    private diagnostics = new Map<string, Diagnostic[]>();

    constructor(public name: string) {}

    set(uri: Uri, diagnostics: Diagnostic[] | undefined): void {
        if (diagnostics) {
            this.diagnostics.set(uri.toString(), diagnostics);
        } else {
            this.diagnostics.delete(uri.toString());
        }
    }

    delete(uri: Uri): void {
        this.diagnostics.delete(uri.toString());
    }

    clear(): void {
        this.diagnostics.clear();
    }

    dispose(): void {
        this.diagnostics.clear();
    }

    get(uri: Uri): Diagnostic[] | undefined {
        return this.diagnostics.get(uri.toString());
    }
}

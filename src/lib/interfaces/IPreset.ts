export interface IPresetFile {
    name: string;
    path: string;
    sha: string;
    size: number;
    url: string;
    html_url: string;
    git_url: string;
    download_url: string;
    type: 'file';
}

export interface IPreset {
    name: string;
    desc: string;
    console: string;
    map: string | number[][]
}
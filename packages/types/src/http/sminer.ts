import { signData } from "@/http/common";
import { FileMetadata, FragmentInfo } from "@/pallets";

export interface DownloadFileReq {
    fmeta: FileMetadata,
    fid: string,
    savePath: string,
    signData: signData,
    cipher?: string
}

export interface DownloadSegmentReq {
    savePath: string,
    fid: string,
    segmentHash: string,
    fragments: FragmentInfo[],
    signData: signData
}

export interface DownloadFragmentReq {
    minerEndpoint: string,
    fid: string,
    fragmentHash: string,
    signData: signData
}
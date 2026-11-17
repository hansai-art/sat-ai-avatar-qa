// 公開的同學提問次數算不同的留言串：原始留言（Q）、公開課程留言（PUB）與上課教室匯入（CLASS-11 起）。
// CLASS-01～10 是舊課堂存檔對照，LIB 是後續排錯畫面，都不另計，算法與 docs/content-source-audit.json 的 askCounts 一致。
export const countedRecord = id => /^(Q|PUB-)\d+$/.test(id) || Number(id.match(/^CLASS-(\d+)$/)?.[1] ?? 0) > 10;
export const countAskedThreads = sourceRefs => new Set(sourceRefs.map(ref => ref.recordId).filter(countedRecord)).size;

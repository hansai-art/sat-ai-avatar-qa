import steps from '../data/install-steps.json';
import {taxonomy,buildMode,getPublished,type Question} from './content';

export interface InstallStep {id:string;title:string;short:string;lessons:string[];description:string;check:string;questions:string[]}
export const installSteps=steps as InstallStep[];

const lessonIds=new Set(taxonomy.chapters.flatMap(c=>c.lessons.map(l=>l.id)));
// 安裝卡關地圖只引用已發布的題目；題號寫錯或題目下架時讓建置失敗，不發布失聯連結。
export function resolveInstallSteps(published:Question[]){
  const byId=new Map(published.map(q=>[q.id,q]));
  const seen=new Set<string>();
  return installSteps.map((step,index)=>{
    for(const lesson of step.lessons)if(!lessonIds.has(lesson))throw new Error(`安裝卡關地圖 ${step.id}：未知小節 ${lesson}`);
    const questions=step.questions.map(id=>{
      const question=byId.get(id);
      if(!question)throw new Error(`安裝卡關地圖 ${step.id}：${id} 不存在或未發布`);
      if(seen.has(id))throw new Error(`安裝卡關地圖：${id} 重複出現在兩個步驟`);
      seen.add(id);
      return question;
    });
    return {...step,number:index+1,questions};
  });
}
// 示範資料沒有正式題號，架構預覽不顯示安裝卡關地圖。
export async function getInstallSteps(){return buildMode==='production'?resolveInstallSteps(await getPublished()):[];}
export const lessonCode=(id:string)=>id.replace(/^ch0?(\d+)-0?(\d+)$/,'$1-$2');
// 公開的同學提問次數只算原始留言（Q 編號）；舊課堂存檔與後續排錯畫面不另計。
export const askedCount=(q:Question)=>new Set(q.data.sourceRefs.map(ref=>ref.recordId).filter(id=>/^Q\d+$/.test(id))).size;

import {createWorker,PSM} from 'tesseract.js';

self.onmessage=async({data:{buffer,assets}}:MessageEvent<{buffer:ArrayBuffer;assets:string}>)=>{
  let engine:Awaited<ReturnType<typeof createWorker>>|undefined;
  try {
    engine=await createWorker(['chi_tra','eng'],1,{
      workerPath:assets+'worker.min.js',corePath:assets,langPath:assets.replace(/\/$/,''),workerBlobURL:false,
      // Cache language data only; image bytes and extracted text are never persisted.
      cachePath:'sat-qa-ocr-v1',
      logger:({status,progress})=>self.postMessage({type:'progress',text:status==='recognizing text'?`正在辨識文字… ${Math.round(progress*100)}%`:'正在準備辨識資料，首次使用可能需要稍等…'}),
      errorHandler:()=>self.postMessage({type:'error'})
    });
    await engine.setParameters({tessedit_pageseg_mode:PSM.SPARSE_TEXT});
    const source=new Blob([buffer]);
    const bitmap=await createImageBitmap(source);
    // Small UI text needs more pixels; cap the working image to limit mobile memory.
    const scale=Math.min(2,Math.sqrt(8_000_000/(bitmap.width*bitmap.height)));
    const canvas=new OffscreenCanvas(Math.round(bitmap.width*scale),Math.round(bitmap.height*scale));
    canvas.getContext('2d')!.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
    const {data}=await engine.recognize(canvas);
    self.postMessage({type:'result',text:data.text});
  }catch{self.postMessage({type:'error'});}
  finally{await engine?.terminate();}
};

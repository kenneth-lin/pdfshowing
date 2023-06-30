# pdf_thumbnail.py
import os
import math
import fitz
import json
from PIL import Image


def pdf_thumbnail(pdf_file_path:str, output_name:str, num_cols:int=3, unit_width:int=1024, padding:tuple=(0,0)):
    '''将指定文件夹下的PDF文件的封面拼接为一张缩略图。

    Args:
        pdf_dir (str): PDF文件夹
        output_name (str): 缩略图保存路径
        num_cols (int, optional): 缩略图中每一行子图数（即列数），总行数根据文件总数确定
        unit_width (int, optional): 缩略图中单张子图的宽度（像素），长度自适应
        padding (tuple, optional): 缩略图中子图之间的水平、竖直间距，默认为0
    '''

    images = []
   
    if os.path.isfile(pdf_file_path):
        img = pdf_to_image(pdf_file_path, 0, unit_width) # cover page
        images.append(img)

    # join images
    img = join_images(images, num_cols, unit_width, padding)
    img.save(output_name)


def pdf_to_image(pdf_file_path:str, page_index:int, min_width:int):
    '''从PDF提取指定页，转为PIL图片对象。'''
    with fitz.open(pdf_file_path) as doc:
        page = doc[page_index]

        # a resolution to ensure the output width not less than `min_width`
        *_, w, h = page.rect
        res = max(min_width/w, 1.0)
        pix = page.get_pixmap(matrix=fitz.Matrix(res, res))
        return Image.frombytes("RGB", [pix.width, pix.height], pix.samples)


def join_images(images:list, num_cols:int, unit_width:int, padding:tuple):
    '''拼接PIL图片列表，返回拼接后的PIL图片对象。'''
    # final size
    num_rows = math.ceil(len(images)/num_cols)
    max_aspect = max(img.size[1]/img.size[0] for img in images) # max aspect ratio
    unit_height = int(unit_width*max_aspect)

    width  = (unit_width +padding[0])*num_cols - padding[0]
    height = (unit_height+padding[1])*num_rows - padding[1]
    final_img = Image.new('RGB', (width, height), (255, 255, 255)) # white and empty image

    # assign image to the right position one by one
    for i_row in range(num_rows):
        for i_col in range(num_cols):
            pos = num_cols*i_row+i_col
            if pos>=len(images): break

            img = images[pos]
            img.thumbnail((unit_width, unit_height), resample=Image.Resampling.LANCZOS)            
            final_img.paste(img, ((unit_width +padding[0])*i_col, (unit_height+padding[1])*i_row))
    
    return final_img

def createThumbnailJson(fileList):
    print(str(len(fileList)) + ' files size will be created!')
    count = 1
    with open("thumbnail.json", 'w', encoding="utf-8") as f:
        data = {}
        for one in fileList:
            outcome = {'pdf':'','thumb':'','size':''}
            size = "%.2f"%(os.path.getsize(one['pdf'])/1000000)
            outcome['size'] = str(size) + "MB"
            outcome['pdf'] = one['pdf']
            outcome['thumb'] = one['thumb']
            data[outcome['thumb']] = outcome
            if count%100 == 0:
                print(str(count) + ' files size are created!')
            count = count+1
        json.dump(data, f, ensure_ascii=False)

def createThumbnailByFileList(fileList):
    print(str(len(fileList)) + ' files will be created!')
    count = 1           
    for one in fileList:        
        pdf_thumbnail(one['pdf'], one['thumb'], num_cols=1, unit_width=320, padding=(0,0))
        if count%20 == 0:
            print(str(count) + ' files are created!')
        count = count+1

    

if __name__ == '__main__':

    fileList = []
    folder = ''

    with open('package.json',encoding='utf-8') as f:
        d = json.load(f)
        folder = d['workpath']
    
    if folder == '' or  not os.path.exists(folder):
        print("Please check the folder.")
    else:
        for root, dirs, files in os.walk(folder):
            for fold in dirs:
                fold = os.path.join('thumbnail',fold)
                if not os.path.exists(fold):
                    os.makedirs(fold)
            for file in files:
                pathfile = os.path.join(root, file)
                if pathfile.endswith(('pdf', 'PDF')):
                    one = {'pdf':'','thumb':''}
                    one['pdf'] = pathfile
                    one['thumb'] = pathfile.replace(folder,r'thumbnail').replace('.pdf','.png')
                    fileList.append(one)        

        createThumbnailJson(fileList)

        fileListNotExist = []
        for one in fileList:
            if not os.path.exists(one['thumb']):
                fileListNotExist.append(one)
        
        createThumbnailByFileList(fileListNotExist)

        print('Done!')

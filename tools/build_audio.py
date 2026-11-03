"""Generate explicitly labelled synthetic learning clips; keep official recordings unchanged."""
import json, subprocess, zipfile
from pathlib import Path
root=Path(__file__).resolve().parents[1]
data=json.loads((root/'content.json').read_text())
for exam in ['ege','oge']:
    archive=zipfile.ZipFile('/tmp/podelu-'+exam+'-2027-current.zip')
    name=next(n for n in archive.namelist() if n.endswith('.mp3') and ('ПЧ' in n))
    (root/'assets/audio'/f'fipi-{exam}-written.mp3').write_bytes(archive.read(name))
done=set()
for item in data['items']:
    if not item.get('synthetic') or item['audio'] in done: continue
    done.add(item['audio'])
    target=root/item['audio']; temp=Path('/tmp')/(target.stem+'-podelu.aiff')
    subprocess.run(['say','-v','Daniel','-r','155','-o',str(temp),item['transcript']],check=True)
    subprocess.run(['/opt/homebrew/bin/ffmpeg','-loglevel','error','-y','-i',str(temp),'-codec:a','libmp3lame','-b:a','64k',str(target)],check=True)
    print(target.name,target.stat().st_size)
for task in data['speaking']:
    if not ((task['exam']=='ege' and task['task']==3) or (task['exam']=='oge' and task['task']==2)): continue
    for i,text in enumerate(task['parts']):
        target=root/'assets/audio'/f"prompt-{task['id']}-{i}.mp3"
        temp=Path('/tmp')/'podelu-prompt.aiff'
        subprocess.run(['say','-v','Daniel','-r','155','-o',str(temp),text],check=True)
        subprocess.run(['/opt/homebrew/bin/ffmpeg','-loglevel','error','-y','-i',str(temp),'-codec:a','libmp3lame','-b:a','64k',str(target)],check=True)

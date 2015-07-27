"""
Copyright (C) 2015 Sanghyuck Lee <shlee322@elab.kr>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
"""
import logging
import os
import sys
import json
import shutil
import subprocess
from os import path
import yaml

root_dir = path.dirname(__file__)
crawler_dir = path.join(root_dir, 'crawler')
data_dir = path.join(root_dir, 'data')

CAMPUS_LIST = []

if __name__ == '__main__':
    def run_crawler(crawler_path):
        campus_id = path.basename(crawler_path)
        campus_data = yaml.load(open(path.join(crawler_path, 'campus.yaml')).read())

        CAMPUS_LIST.append({
            'id': campus_id,
            'univ_name': campus_data['name']['univ'],
            'campus_name': campus_data['name']['campus'],
        })

        logging.info("run crawler(id=%s)" % campus_id)

        # 강의 리스트 불러옴
        campus_data_dir = path.join(data_dir, campus_id)
        if not path.exists(campus_data_dir):
            os.makedirs(campus_data_dir)

        # 업데이트 해야할 학기 데이터
        campus_update_data = campus_data.get('update')
        if campus_update_data:
            if type(campus_update_data) is dict:
                campus_update_data = [campus_update_data]

            for term in campus_update_data:
                update_process = path.join(crawler_path, term['script'])
                update_data_dir = path.join(campus_data_dir, str(term['year']), str(term['term']))
                if path.exists(update_data_dir):
                    shutil.rmtree(update_data_dir)
                os.makedirs(update_data_dir)

                # 크롤러 실행
                subprocess.call(
                    [sys.executable, update_process, str(term['year']), str(term['term']), update_data_dir],
                    env=os.environ.copy()
                )

                term_list = []
                for name in os.listdir(path.join(campus_data_dir, str(term['year']))):
                    if path.isdir(path.join(campus_data_dir, str(term['year']), name)):
                        term_list.append({
                            'id': int(name),
                            'name': str(campus_data['name']['term'][int(name)])
                        })

                open(path.join(campus_data_dir, str(term['year']), 'term.json'), 'w').write(json.dumps(term_list))

        # 년도 데이터 생성
        year_list = []
        for name in os.listdir(campus_data_dir):
            if path.isdir(path.join(campus_data_dir, name)):
                year_list.append(int(name))

        year_list.sort(reverse=True)

        open(path.join(campus_data_dir, 'year.json'), 'w').write(json.dumps(year_list))
        open(path.join(campus_data_dir, 'default.json'), 'w').write(json.dumps(campus_data.get('default')))

        # 서버 시간 안내를 위한 시간을 조회할 서버
        open(path.join(campus_data_dir, 'timeserver.json'), 'w').write(json.dumps(campus_data.get('timeserver')))

    # template
    print('create index.html')
    from jinja2 import Environment, FileSystemLoader
    env = Environment(loader=FileSystemLoader(path.join(root_dir, 'templates')))
    template = env.get_template('index.html')
    open(path.join(root_dir, 'index.html'), 'w').write(template.render())

    if len(sys.argv) > 1 and sys.argv[1] == 'template_only':
        exit()

    for crawler in os.listdir(crawler_dir):
        run_crawler(path.join(crawler_dir, crawler))

    # write campus.json
    open(path.join(data_dir, 'campus.json'), 'w').write(json.dumps(CAMPUS_LIST))

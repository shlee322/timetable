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
import json


def jsonp(text):
    start = text.find('(')
    end = text.rfind(')')

    if start == -1 or end == -1:
        raise ValueError

    return json.loads(text[start+1:end])

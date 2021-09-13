// Copyright (c) 2021 Its Personal TechLauncher Team
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
"use strict";

const Tp = require('thingpedia');

const SPORTS_SERVICE_URL = 'https://itspersonal-sports-newsfilter.herokuapp.com/';
const TECH_SERVICE_URL = 'https://itspersonal-tech-newsfilter.herokuapp.com/';

module.exports = class NewsFilter extends Tp.BaseDevice {
    /* 
    A query function called "get_news_article", which returns news article of $topic
    the "get" before the underscore tells the system this is a "query" function instead of an "action" function
    the "news_article" after the underscore indicates the name of the function
    */
    async get_news_article({topic}) {
        var parsed;
        if (topic === "tech") {
            parsed = JSON.parse(await Tp.Helpers.Http.get(TECH_SERVICE_URL + topic, {
                accept: 'application/json'
            }));
        } else {
            parsed = JSON.parse(await Tp.Helpers.Http.get(SPORTS_SERVICE_URL + topic, {
                accept: 'application/json'
            }));
        }
        
        var data = parsed.data;
        var result = [];
        data.forEach((item) => {
            result.push(
                {
                    title: item.title,
                    description: item.summary,
                    link: item.link
                }
            );
        });
        return result;
    }
    
    /* 
    A query function called "get_training_news_article", which returns a random news article for $topic training dataset
    the "get" before the underscore tells the system this is a "query" function instead of an "action" function
    the "training_news_article" after the underscore indicates the name of the function
    */
    async get_training_news_article({topic}) {
        var parsed;
        if (topic === "tech") {
            parsed = JSON.parse(await Tp.Helpers.Http.get(TECH_SERVICE_URL + 'random', {
                accept: 'application/json'
            }));
        } else {
            parsed = JSON.parse(await Tp.Helpers.Http.get(SPORTS_SERVICE_URL + 'random', {
                accept: 'application/json'
            }));
        }
        var data = parsed.data;
        return [{
            id: new Tp.Value.Entity((data.title + '\\' + topic), null),
            title: data.title,
            description: data.summary,
            link: data.link
        }];
    }

    /* 
    An action function called "do_mark_training_news_article", which returns news article of $topic
    the "do" before the underscore tells the system this is an "action" function instead of an "query" function
    the "mark_training_news_article" after the underscore indicates the name of the function
    */
    async do_mark_training_news_article({id, relevant}) {
        var str = id.value.split("\\");
        if (str[1] === "tech") return Tp.Helpers.Http.get(TECH_SERVICE_URL + 'training/' + str[1] + '/' + str[0] + '/' + relevant);
        else return Tp.Helpers.Http.get(SPORTS_SERVICE_URL + 'training/' + str[1] + '/' + str[0] + '/' + relevant);        
    }
};
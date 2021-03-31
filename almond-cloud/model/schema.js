// -*- mode: js; indent-tabs-mode: nil; js-basic-offset: 4 -*-
//
// This file is part of Almond
//
// Copyright 2016-2019 The Board of Trustees of the Leland Stanford Junior University
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// Author: Giovanni Campagna <gcampagn@cs.stanford.edu>
"use strict";

const db = require('../util/db');

function insertTranslations(dbClient, schemaId, version, language, translations) {
    const channelCanonicals = [];

    for (let name in translations) {
        const meta = translations[name];

        channelCanonicals.push([schemaId, version, language, name,
                                meta.canonical,
                                meta.confirmation,
                                meta.confirmation_remote || meta.confirmation,
                                JSON.stringify(meta.formatted),
                                JSON.stringify(meta.argcanonicals),
                                JSON.stringify(meta.questions)]);
    }

    if (channelCanonicals.length === 0)
        return Promise.resolve();

    return db.insertOne(dbClient, 'replace into device_schema_channel_canonicals(schema_id, version, language, name, '
            + 'canonical, confirmation, confirmation_remote, formatted, argcanonicals, questions) values ?', [channelCanonicals]);
}

function insertChannels(dbClient, schemaId, schemaKind, kindType, version, language, metas) {
    const channels = [];
    const channelCanonicals = [];

    function makeList(what, from) {
        for (let name in from) {
            const meta = from[name];
            channels.push([schemaId, version, name, what,
                           meta.doc,
                           meta.extends && meta.extends.length ? JSON.stringify(meta.extends) : null,
                           JSON.stringify(meta.types),
                           JSON.stringify(meta.args),
                           JSON.stringify(meta.required),
                           JSON.stringify(meta.is_input),
                           JSON.stringify(meta.string_values),
                           !!meta.is_list,
                           !!meta.is_monitorable,
                           !!meta.confirm]);
            channelCanonicals.push([schemaId, version, language, name,
                                    meta.canonical,
                                    meta.confirmation,
                                    meta.confirmation_remote,
                                    JSON.stringify(meta.formatted),
                                    JSON.stringify(meta.argcanonicals),
                                    JSON.stringify(meta.questions)]);
        }
    }

    makeList('trigger', metas.triggers || {});
    makeList('query', metas.queries || {});
    makeList('action', metas.actions || {});

    if (channels.length === 0)
        return Promise.resolve();

    return db.insertOne(dbClient, 'insert into device_schema_channels(schema_id, version, name, '
        + 'channel_type, doc, extends, types, argnames, required, is_input, string_values, is_list, is_monitorable, confirm) values ?', [channels])
        .then(() => {
            return db.insertOne(dbClient, 'insert into device_schema_channel_canonicals(schema_id, version, language, name, '
            + 'canonical, confirmation, confirmation_remote, formatted, argcanonicals, questions) values ?', [channelCanonicals]);
        });
}

function create(client, schema, meta) {
    var KEYS = ['kind', 'kind_canonical', 'kind_type', 'owner', 'approved_version', 'developer_version'];
    KEYS.forEach((key) => {
        if (schema[key] === undefined)
            schema[key] = null;
    });
    var vals = KEYS.map((key) => schema[key]);
    var marks = KEYS.map(() => '?');

    return db.insertOne(client, 'insert into device_schema(' + KEYS.join(',') + ') '
                        + 'values (' + marks.join(',') + ')', vals).then((id) => {
        schema.id = id;
        return insertChannels(client, schema.id, schema.kind, schema.kind_type, schema.developer_version, 'en', meta);
    }).then(() => schema);
}

function update(client, id, kind, schema, meta) {
    return db.query(client, "update device_schema set ? where id = ?", [schema, id]).then(() => {
    }).then(() => {
        return insertChannels(client, id, kind, schema.kind_type, schema.developer_version, 'en', meta);
    }).then(() => {
        schema.id = id;
        return schema;
    });
}

function processMetaRows(rows) {
    var out = [];
    var current = null;
    rows.forEach((row) => {
        if (current === null || current.kind !== row.kind) {
            current = {
                kind: row.kind,
                kind_type: row.kind_type,
                kind_canonical: row.kind_canonical
            };
            current.triggers = {};
            current.queries = {};
            current.actions = {};
            out.push(current);
        }
        if (row.channel_type === null)
            return;
        var types = JSON.parse(row.types);
        var obj = {
            extends: JSON.parse(row.extends),
            types: types,
            args: JSON.parse(row.argnames),
            required: JSON.parse(row.required) || [],
            is_input: JSON.parse(row.is_input) || [],
            is_list: !!row.is_list,
            is_monitorable: !!row.is_monitorable,
            confirm: !!row.confirm,
            confirmation: row.confirmation,
            confirmation_remote: row.confirmation_remote || row.confirmation, // for compatibility
            formatted: JSON.parse(row.formatted || '[]'),
            doc: row.doc,
            canonical: row.canonical,
            argcanonicals: JSON.parse(row.argcanonicals) || [],
            questions: JSON.parse(row.questions) || [],
            string_values: JSON.parse(row.string_values) || [],
        };
        if (obj.args.length < types.length) {
            for (var i = obj.args.length; i < types.length; i++)
                obj.args[i] = 'arg' + (i+1);
        }
        switch (row.channel_type) {
        case 'action':
            current.actions[row.name] = obj;
            break;
        case 'trigger':
            current.triggers[row.name] = obj;
            break;
        case 'query':
            current.queries[row.name] = obj;
            break;
        default:
            throw new TypeError();
        }
    });
    return out;
}

function processTypeRows(rows) {
    var out = [];
    var current = null;
    rows.forEach((row) => {
        if (current === null || current.kind !== row.kind) {
            current = {
                kind: row.kind,
                kind_type: row.kind_type
            };
            current.triggers = {};
            current.queries = {};
            current.actions = {};
            out.push(current);
        }
        if (row.channel_type === null)
            return;
        var obj = {
            extends: JSON.parse(row.extends),
            types: JSON.parse(row.types),
            args: JSON.parse(row.argnames),
            required: JSON.parse(row.required),
            is_input: JSON.parse(row.is_input),
            is_list: !!row.is_list,
            is_monitorable: !!row.is_monitorable,
        };
        switch (row.channel_type) {
        case 'action':
            current.actions[row.name] = obj;
            break;
        case 'trigger':
            current.triggers[row.name] = obj;
            break;
        case 'query':
            current.queries[row.name] = obj;
            break;
        default:
            throw new TypeError();
        }
    });
    return out;
}

module.exports = {
    get(client, id) {
        return db.selectOne(client, "select * from device_schema where id = ?", [id]);
    },

    async findNonExisting(client, ids, org) {
        if (ids.length === 0)
            return Promise.resolve([]);

        const rows = await db.selectAll(client, `select kind from device_schema where kind in (?)
            and (owner = ? or approved_version is not null or exists (select 1 from organizations where organizations.id = ? and is_admin))`,
            [ids, org, org]);
        if (rows.length === ids.length)
            return [];
        let existing = new Set(rows.map((r) => r.id));
        let missing = [];
        for (let id of ids) {
            if (!existing.has(id))
                missing.push(id);
        }
        return missing;
    },

    getAllApproved(client, org) {
        if (org === -1) {
            return db.selectAll(client, `select kind, kind_canonical from device_schema
                where kind_type in ('primary','other')`,
                []);
        } else if (org !== null) {
            return db.selectAll(client, `select kind, kind_canonical from device_schema
                where (approved_version is not null or owner = ?)
                and kind_type in ('primary','other')`,
                [org]);
        } else {
            return db.selectAll(client, `select kind, kind_canonical from device_schema
                where approved_version is not null and kind_type in ('primary','other')`,
                []);
        }
    },

    getCurrentSnapshotTypes(client, org) {
        if (org === -1) {
            return db.selectAll(client, `select name, extends, types, argnames, required, is_input,
                is_list, is_monitorable, channel_type, kind, kind_type from device_schema ds
                left join device_schema_channels dsc on ds.id = dsc.schema_id
                and dsc.version = ds.developer_version`,
                []).then(processTypeRows);
        } else if (org !== null) {
            return db.selectAll(client, `select name, extends, types, argnames, required, is_input,
                is_list, is_monitorable, channel_type, kind, kind_type from device_schema ds
                left join device_schema_channels dsc on ds.id = dsc.schema_id
                and ((dsc.version = ds.developer_version and ds.owner = ?) or
                    (dsc.version = ds.approved_version and ds.owner <> ?))
                where (ds.approved_version is not null or ds.owner = ?)`,
                [org, org, org]).then(processTypeRows);
        } else {
            return db.selectAll(client, `select name, extends, types, argnames, required, is_input,
                is_list, is_monitorable, channel_type, kind, kind_type from device_schema ds
                left join device_schema_channels dsc on ds.id = dsc.schema_id
                and dsc.version = ds.approved_version where ds.approved_version is not null`,
                []).then(processTypeRows);
        }
    },

    getCurrentSnapshotMeta(client, language, org) {
        if (org === -1) {
            return db.selectAll(client, `select dsc.name, channel_type, extends, canonical, confirmation,
                confirmation_remote, formatted, doc, types, argnames, argcanonicals, required, is_input,
                is_list, is_monitorable, string_values, questions, confirm, kind, kind_canonical, kind_type
                from device_schema ds
                left join device_schema_channels dsc on ds.id = dsc.schema_id
                and dsc.version = ds.developer_version
                left join device_schema_channel_canonicals dscc on dscc.schema_id = dsc.schema_id and
                dscc.version = dsc.version and dscc.name = dsc.name and dscc.language = ?`,
                [language]).then(processMetaRows);
        } else if (org !== null) {
            return db.selectAll(client, `select dsc.name, channel_type, extends, canonical, confirmation,
                confirmation_remote, formatted, doc, types, argnames, argcanonicals, required, is_input,
                is_list, is_monitorable, string_values, questions, confirm, kind, kind_canonical, kind_type
                from device_schema ds
                left join device_schema_channels dsc on ds.id = dsc.schema_id
                and ((dsc.version = ds.developer_version and ds.owner = ?) or
                     (dsc.version = ds.approved_version and ds.owner <> ?))
                left join device_schema_channel_canonicals dscc on dscc.schema_id = dsc.schema_id and
                dscc.version = dsc.version and dscc.name = dsc.name and dscc.language = ?
                where (ds.approved_version is not null or ds.owner = ?)`,
                [org, org, language, org]).then(processMetaRows);
        } else {
            return db.selectAll(client, `select dsc.name, channel_type, extends, canonical, confirmation,
                confirmation_remote, formatted, doc, types, argnames, argcanonicals, required, is_input,
                is_list, is_monitorable, string_values, questions, confirm, kind, kind_canonical, kind_type
                from device_schema ds
                left join device_schema_channels dsc on ds.id = dsc.schema_id
                and dsc.version = ds.approved_version
                left join device_schema_channel_canonicals dscc on dscc.schema_id = dsc.schema_id and
                dscc.version = dsc.version and dscc.name = dsc.name and dscc.language = ?
                where ds.approved_version is not null`,
                [language]).then(processMetaRows);
        }
    },

    getSnapshotTypes(client, snapshotId, org) {
        if (org === -1) {
            return db.selectAll(client, `select name, extends, types, argnames, required, is_input,
                is_list, is_monitorable, channel_type, kind, kind_type from device_schema_snapshot ds
                left join device_schema_channels dsc on ds.schema_id = dsc.schema_id
                and dsc.version = ds.developer_version and ds.snapshot_id = ?`,
                [snapshotId]).then(processTypeRows);
        } else if (org !== null) {
            return db.selectAll(client, `select name, extends, types, argnames, required, is_input,
                is_list, is_monitorable, channel_type, kind, kind_type from device_schema_snapshot ds
                left join device_schema_channels dsc on ds.schema_id = dsc.schema_id
                and ((dsc.version = ds.developer_version and ds.owner = ?) or
                    (dsc.version = ds.approved_version and ds.owner <> ?))
                where (ds.approved_version is not null or ds.owner = ?) and ds.snapshot_id = ?`,
                [org, org, org, snapshotId]).then(processTypeRows);
        } else {
            return db.selectAll(client, `select name, extends, types, argnames, required, is_input,
                is_list, is_monitorable, channel_type, kind, kind_type from device_schema_snapshot ds
                left join device_schema_channels dsc on ds.schema_id = dsc.schema_id
                and dsc.version = ds.approved_version where ds.approved_version is not null
                and ds.snapshot_id = ?`,
                [snapshotId]).then(processTypeRows);
        }
    },

    getSnapshotMeta(client, snapshotId, language, org) {
        if (org === -1) {
            return db.selectAll(client, `select dsc.name, channel_type, extends, canonical, confirmation,
                confirmation_remote, formatted, doc, types, argnames, argcanonicals, required, is_input,
                is_list, is_monitorable, string_values, questions, confirm, kind, kind_canonical, kind_type
                from device_schema_snapshot ds
                left join device_schema_channels dsc on ds.schema_id = dsc.schema_id
                and dsc.version = ds.developer_version
                left join device_schema_channel_canonicals dscc on dscc.schema_id = dsc.schema_id and
                dscc.version = dsc.version and dscc.name = dsc.name
                and dscc.language = ? and ds.snapshot_id = ?`,
                [language, snapshotId]).then(processMetaRows);
        } else if (org !== null) {
            return db.selectAll(client, `select dsc.name, channel_type, extends, canonical, confirmation,
                confirmation_remote, formatted, doc, types, argnames, argcanonicals, required, is_input,
                is_list, is_monitorable, string_values, questions, confirm, kind, kind_canonical, kind_type
                from device_schema_snapshot ds
                left join device_schema_channels dsc on ds.schema_id = dsc.schema_id
                and ((dsc.version = ds.developer_version and ds.owner = ?) or
                     (dsc.version = ds.approved_version and ds.owner <> ?))
                left join device_schema_channel_canonicals dscc on dscc.schema_id = dsc.schema_id and
                dscc.version = dsc.version and dscc.name = dsc.name and dscc.language = ?
                where (ds.approved_version is not null or ds.owner = ?) and ds.snapshot_id = ?`,
                [org, org, language, org, snapshotId]).then(processMetaRows);
        } else {
            return db.selectAll(client, `select dsc.name, channel_type, extends, canonical, confirmation,
                confirmation_remote, formatted, doc, types, argnames, argcanonicals, required, is_input,
                is_list, is_monitorable, string_values, questions, confirm, kind, kind_canonical, kind_type
                from device_schema_snapshot ds
                left join device_schema_channels dsc on ds.schema_id = dsc.schema_id
                and dsc.version = ds.approved_version
                left join device_schema_channel_canonicals dscc on dscc.schema_id = dsc.schema_id and
                dscc.version = dsc.version and dscc.name = dsc.name and dscc.language = ?
                where ds.approved_version is not null and ds.snapshot_id = ?`,
                [language, snapshotId]).then(processMetaRows);
        }
    },

    getByKind(client, kind) {
        return db.selectOne(client, "select * from device_schema where kind = ?", [kind]);
    },

    async getTypesAndNamesByKinds(client, kinds, org) {
        let rows;
        if (org === -1) {
            rows = await db.selectAll(client, `select name, extends, types, argnames, required, is_input,
                is_list, is_monitorable, channel_type, kind, kind_type from device_schema ds
                left join device_schema_channels dsc on ds.id = dsc.schema_id
                and dsc.version = ds.developer_version where ds.kind in (?)`,
                [kinds]);
        } else if (org !== null) {
            rows = await db.selectAll(client, `select name, extends, types, argnames, required, is_input,
                is_list, is_monitorable, channel_type, kind, kind_type from device_schema ds
                left join device_schema_channels dsc on ds.id = dsc.schema_id
                and ((dsc.version = ds.developer_version and ds.owner = ?) or
                (dsc.version = ds.approved_version and ds.owner <> ?)) where
                ds.kind in (?) and (ds.approved_version is not null or ds.owner = ?)`,
                [org, org, kinds, org]);
        } else {
            rows = await db.selectAll(client, `select name, extends, types, argnames, required, is_input,
                is_list, is_monitorable, channel_type, kind, kind_type from device_schema ds
                left join device_schema_channels dsc on ds.id = dsc.schema_id
                and dsc.version = ds.approved_version where ds.kind in (?)
                and ds.approved_version is not null`,
                [kinds]);
        }
        return processTypeRows(rows);
    },

    async getMetasByKinds(client, kinds, org, language) {
        let rows;
        if (org === -1) {
            rows = await db.selectAll(client, `select dsc.name, channel_type, extends, canonical, confirmation,
                confirmation_remote, formatted, doc, types, argnames, argcanonicals, required, is_input,
                string_values, is_list, is_monitorable, questions, confirm, kind, kind_canonical, kind_type
                from device_schema ds left join
                device_schema_channels dsc on ds.id = dsc.schema_id and
                dsc.version = ds.developer_version left join device_schema_channel_canonicals dscc
                on dscc.schema_id = dsc.schema_id and dscc.version = dsc.version and
                dscc.name = dsc.name and dscc.language = ? where ds.kind in (?)`,
                [language, kinds]);
        } else if (org !== null) {
            rows = await db.selectAll(client, `select dsc.name, channel_type, extends, canonical, confirmation,
                confirmation_remote, formatted, doc, types, argnames, argcanonicals, required, is_input,
                string_values, is_list, is_monitorable, questions, confirm, kind, kind_canonical, kind_type
                from device_schema ds left join
                device_schema_channels dsc on ds.id = dsc.schema_id and
                ((dsc.version = ds.developer_version and ds.owner = ?) or
                 (dsc.version = ds.approved_version and ds.owner <> ?))
                left join device_schema_channel_canonicals dscc on dscc.schema_id = dsc.schema_id
                and dscc.version = dsc.version and dscc.name = dsc.name and dscc.language = ?
                where ds.kind in (?) and (ds.approved_version is not null or ds.owner = ?)`,
                [org, org, language, kinds, org]);
        } else {
            rows = await db.selectAll(client, `select dsc.name, channel_type, extends, canonical, confirmation,
                confirmation_remote, formatted, doc, types, argnames, argcanonicals, required, is_input,
                string_values, is_list, is_monitorable, questions, confirm, kind, kind_canonical, kind_type
                from device_schema ds left join device_schema_channels
                dsc on ds.id = dsc.schema_id and dsc.version = ds.approved_version left join
                device_schema_channel_canonicals dscc on dscc.schema_id = dsc.schema_id and
                dscc.version = dsc.version and dscc.name = dsc.name and dscc.language = ?
                where ds.kind in (?) and ds.approved_version is not null`,
                [language, kinds]);
        }
        return processMetaRows(rows);
    },

    async getMetasByKindAtVersion(client, kind, version, language) {
        const rows = await db.selectAll(client, `select dsc.name, channel_type, extends, canonical,
            confirmation, confirmation_remote, formatted, doc, types, argnames, argcanonicals,
            required, is_input, string_values, is_list, is_monitorable, questions, confirm, kind,
            kind_canonical, kind_type
            from device_schema ds left join device_schema_channels dsc
            on ds.id = dsc.schema_id and dsc.version = ?
            left join device_schema_channel_canonicals dscc on dscc.schema_id = dsc.schema_id and
            dscc.version = dsc.version and dscc.name = dsc.name and dscc.language = ? where ds.kind = ?`,
            [version, language, kind]);
        return processMetaRows(rows);
    },

    isKindTranslated(client, kind, language) {
        return db.selectOne(client, " select"
            + " (select count(*) from device_schema_channel_canonicals, device_schema"
            + " where language = 'en' and id = schema_id and version = developer_version"
            + " and kind = ?) as english_count, (select count(*) from "
            + "device_schema_channel_canonicals, device_schema where language = ? and "
            + "version = developer_version and id = schema_id and kind = ?) as translated_count",
            [kind, language, kind]).then((row) => {
                return row.english_count <= row.translated_count;
            });
    },

    create,
    update,
    delete(client, id) {
        return db.query(client, "delete from device_schema where id = ?", [id]);
    },
    deleteByKind(client, kind) {
        return db.query(client, "delete from device_schema where kind = ?", [kind]);
    },

    approve(client, id) {
        return db.query(client, "update device_schema set approved_version = developer_version where id = ?", [id]);
    },

    approveByKind(dbClient, kind) {
        return db.query(dbClient, "update device_schema set approved_version = developer_version where kind = ?", [kind]);
    },
    unapproveByKind(dbClient, kind) {
        return db.query(dbClient, "update device_schema set approved_version = null where kind = ?", [kind]);
    },

    insertChannels,
    insertTranslations
};

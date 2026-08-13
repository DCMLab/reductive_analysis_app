/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Merah, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/
// Schema associations written into every exported MEI file. The RelaxNG and
// Schematron schemata both cover the graphic-analysis customization.
const MEI_SCHEMA_URLS = {
  rng: 'https://raw.githubusercontent.com/yrammos/music-encoding-graph-schema/refs/heads/graph/dist/schemata/mei-graphicanalysis.rng',
  sch: 'https://raw.githubusercontent.com/yrammos/music-encoding-graph-schema/refs/heads/graph/dist/schemata/mei-graphicanalysis.sch'
}

const MEI_VERSION = '6.0-dev'

const MEI_HEADER =
  `<?xml-model href="${MEI_SCHEMA_URLS.rng}" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?>` +
  `<?xml-model href="${MEI_SCHEMA_URLS.sch}" type="application/xml" schematypens="http://purl.oclc.org/dsdl/schematron"?>`

/**
 * Prepend the graphic-analysis schema associations to a serialized MEI document.
 *
 * Any xml-model instructions already present are dropped first, so that files
 * loaded with stale or local schema paths are exported with the canonical URLs.
 * The root element is also stamped with the MEI version this app targets.
 *
 * @param {string} xml Serialized MEI
 * @returns {string} The same MEI, preceded by the schema associations
 */
export function withMeiHeader(xml) {
  // Drop any existing xml-model instructions, wherever they sit in the prolog.
  let body = xml.replace(/<\?xml-model[\s\S]*?\?>\s*/g, '')

  // Keep an XML declaration, if present, ahead of the schema associations.
  let declaration = ''
  const declarationMatch = body.match(/^\s*<\?xml\s[\s\S]*?\?>\s*/)
  if (declarationMatch) {
    declaration = declarationMatch[0].trim()
    body = body.slice(declarationMatch[0].length)
  }

  // Stamp the MEI version only when the root element declares none. A version
  // already present belongs to the encoding and is left as its author wrote it.
  body = body.replace(/<mei(\s[^>]*?)?>/, (match, attributes) => {
    const attrs = attributes || ''
    if (/\smeiversion\s*=/.test(attrs)) return match
    return `<mei meiversion="${MEI_VERSION}"${attrs}>`
  })

  return declaration + MEI_HEADER + body
}

/**
 * Trigger a file download
 * https://pqina.nl/blog/how-to-prompt-the-user-to-download-a-file-instead-of-navigating-to-it
 *
 * When browsers support evolves, it could use the FileSystem API:
 * https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API
 * https://web.dev/file-system-access/
 *
 * @param {*} filedata
 * @param {string} filename
 * @param {string} mimeType
 */
export function downloadAs(filedata, filename, mimeType) {
  const file = new Blob([filedata], { type: mimeType })

  const link = document.createElement('a')
  link.style.display = 'none'
  link.href = URL.createObjectURL(file)
  link.download = filename

  document.body.appendChild(link)
  link.click()

  // timeout apparently needed on Firefox
  setTimeout(() => {
    URL.revokeObjectURL(link.href)
    link.remove()
  }, 0)
}

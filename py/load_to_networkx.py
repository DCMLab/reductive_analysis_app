#/bin/env python3
import networkx as nx
import lxml.etree as ET
import music21

# Basic loader script to networkx for the graphs produced by the reductive
# annotation app. 

# Get the type of a relation graph node (if any)
def get_relation_type(node):
  return node[0].attrib.get('type'))

# Fetch the relevant info for a graph node - either its type or the note it
# represents (both MEI element and the parsed info from Music21)
def node_get_info(id_dict,m21_parse,node):
  if(node.attrib.get('type') == 'hyperedge'): #TODO sub for "relation" maybe
    return (node,{'hyperedge' : True, 'type': get_relation_type(node)})
  if(node.attrib.get('type') == 'metaedge'): #TODO sub for "metarelation" maybe
    return (node,{'metaedge' : True, 'type': get_relation_type(node)})
  else: 
    sameas_id = node[0][0].attrib['sameas'].strip("#")
    return (node,{'note_elem': id_dict[sameas_id], 'note_m21': m21_parse.flat.getElementById(sameas_id)})

# Edge info is basically if its primary or secondary
def edge_get_info(id_dict, edge):
  from_node = id_dict[edge.attrib['from'].strip("#")]
  to_node = id_dict[edge.attrib['to'].strip("#")]
  return (from_node,to_node,{'type' : edge.attrib.get('type')})

# Given a graph element - load it
def load_graph(id_dict,m21_parse,g_elem):
  G = nx.Graph()
  nodes = g_elem.findall('node')
  nodes_with_info = map(lambda n : node_get_info(id_dict,m21_parse,n), nodes)
  edges = g_elem.findall('arc')
  edges_with_info = map(lambda e : edge_get_info(id_dict,e), edges)
  G.add_nodes_from(nodes_with_info)
  G.add_edges_from(edges_with_info)
  return G

# Given a file, load it into both ETree and Music21, and extract any
# graphs. Return them as a list.
def load_graphs_from_file(f):
  with open(f,'r') as f_read:
    f_str = f_read.read()
  [tree,id_dict] = ET.XMLDTDID(f_str.encode())
  m21_parse = music21.mei.base.MeiToM21Converter(f_str).run()
  ret = []
  for g_elem in tree.iter('graph'):
    ret.append(load_graph(id_dict,m21_parse,g_elem))
  return ret





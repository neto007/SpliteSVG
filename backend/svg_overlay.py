#!/usr/bin/env python3
import sys
import xml.etree.ElementTree as ET
import re

def get_dimensions(root):
    width = root.get('width')
    height = root.get('height')
    viewBox = root.get('viewBox')
    return width, height, viewBox

def main():
    if len(sys.argv) < 3:
        print("Usage: python3 svg_overlay.py output.svg input1.svg input2.svg ...")
        sys.exit(1)

    output_file = sys.argv[1]
    input_files = sys.argv[2:]

    # Parse the first file to get base dimensions and structure
    try:
        ET.register_namespace('', "http://www.w3.org/2000/svg")
        first_tree = ET.parse(input_files[0])
        first_root = first_tree.getroot()
    except Exception as e:
        print(f"Error parsing {input_files[0]}: {e}")
        sys.exit(1)

    # Create a new root for the merged SVG
    merged_root = ET.Element('svg')
    # Copy attributes from the first SVG (width, height, viewBox, etc.)
    for key, value in first_root.attrib.items():
        merged_root.set(key, value)
    
    # Ensure xmlns is set (ET usually handles this via register_namespace, but explicit check doesn't hurt)
    # Removing manual xmlns setting as it causes duplicate attributes with ElementTree's automatic handling
    # if 'xmlns' not in merged_root.attrib:
    #     merged_root.set('xmlns', "http://www.w3.org/2000/svg")

    # Iterate through all input files and append their content as groups
    for i, fpath in enumerate(input_files):
        try:
            tree = ET.parse(fpath)
            root = tree.getroot()
            
            # Create a group for this file's content
            g = ET.SubElement(merged_root, 'g', id=f"layer_{i}")
            
            # Move all children from root to the new group
            # We copy list(root) to avoid modifying the iterator while moving
            for child in list(root):
                 g.append(child)
                 
        except Exception as e:
            print(f"Warning: Failed to process {fpath}: {e}")

    # Write output
    try:
        tree = ET.ElementTree(merged_root)
        tree.write(output_file, encoding='utf-8', xml_declaration=True)
        print(f"Successfully created {output_file}")
    except Exception as e:
        print(f"Error writing output: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

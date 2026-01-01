#!/usr/bin/env python3
import sys
import os
import numpy as np
from PIL import Image
from scipy.ndimage import label, find_objects, binary_dilation

def extract_objects(image_path, output_dir):
    """
    Extracts distinct objects (connected components) from an image 
    based on transparency/content and saves them as separate files.
    """
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    try:
        img = Image.open(image_path).convert("RGBA")
    except Exception as e:
        print(f"Error opening image {image_path}: {e}")
        sys.exit(1)

    # Convert to numpy array
    data = np.array(img)
    
    # Determine based on global color difference (more robust to borders/frames than floodfill)
    bg_sample = data[0, 0]
    
    if bg_sample[3] < 10:
        # Transparent background
        print("Detecting based on transparency...")
        mask = data[:, :, 3] > 10
    else:
        # Solid background
        print(f"Detecting based on background color {bg_sample}...")
        diff = np.linalg.norm(data[:, :, :3] - bg_sample[:3], axis=2)
        # Content is where difference is HIGH (not background)
        mask = diff > 20

    # Dilate the mask slightly to remove noise, but rely on box merging for connection
    print("Dilating mask to clean up...")
    dilated_mask = binary_dilation(mask, iterations=5)

    # Find connected components on the DILATED mask
    labeled_array, num_features = label(dilated_mask)
    
    print(f"Found {num_features} potential components.")
    
    objects_slices = find_objects(labeled_array)
    
    # Collect valid bounding boxes
    raw_boxes = []
    img_area = img.width * img.height
    
    for i, slice_obj in enumerate(objects_slices):
        if slice_obj is None:
            continue
        
        y_slice, x_slice = slice_obj
        x1, x2 = x_slice.start, x_slice.stop
        y1, y2 = y_slice.start, y_slice.stop
        
        w = x2 - x1
        h = y2 - y1
        
        # Filter noise based on AREA
        # Smallest valid logo seen is ~24000 px area. Noise is ~9000 px.
        if (w * h) < 12000:
            continue
        
        # Filter huge background
        if (w * h) > (img_area * 0.8):
            continue
            
        raw_boxes.append({'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2})

    print(f"Found {len(raw_boxes)} raw components. Merging nearby boxes...")
    
    def boxes_intersect_or_close(b1, b2, tolerance=20):
        # Check if boxes are close in X and overlap in Y, or vice versa
        # Horizontal closeness
        h_overlap = not (b1['x2'] + tolerance < b2['x1'] or b2['x2'] + tolerance < b1['x1'])
        v_overlap = not (b1['y2'] + tolerance < b2['y1'] or b2['y2'] + tolerance < b1['y1'])
        return h_overlap and v_overlap

    # Iterative merging
    merged_boxes = raw_boxes[:]
    changed = True
    while changed:
        changed = False
        new_merged = []
        used = [False] * len(merged_boxes)
        
        for i in range(len(merged_boxes)):
            if used[i]: continue
            
            current = merged_boxes[i]
            used[i] = True
            
            # Try to merge with any other unused box
            for j in range(i + 1, len(merged_boxes)):
                if used[j]: continue
                
                other = merged_boxes[j]
                if boxes_intersect_or_close(current, other):
                    # Merge
                    current['x1'] = min(current['x1'], other['x1'])
                    current['y1'] = min(current['y1'], other['y1'])
                    current['x2'] = max(current['x2'], other['x2'])
                    current['y2'] = max(current['y2'], other['y2'])
                    used[j] = True
                    changed = True
            
            new_merged.append(current)
        merged_boxes = new_merged

    print(f"Merged into {len(merged_boxes)} final objects.")

    count = 0
    padding = 20
    
    for box in merged_boxes:
        # Add padding
        x1 = max(0, box['x1'] - padding)
        y1 = max(0, box['y1'] - padding)
        x2 = min(img.width, box['x2'] + padding)
        y2 = min(img.height, box['y2'] + padding)
        
        # Crop
        crop = img.crop((x1, y1, x2, y2))
        
        filename = f"logo_{count:02d}.png"
        save_path = os.path.join(output_dir, filename)
        crop.save(save_path)
        print(f"  -> Saved {filename} ({crop.width}x{crop.height})")
        count += 1


    print(f"Successfully extracted {count} objects to {output_dir}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 extract_objects.py <input_image> <output_dir>")
        sys.exit(1)
        
    input_img = sys.argv[1]
    out_dir = sys.argv[2]
    
    extract_objects(input_img, out_dir)

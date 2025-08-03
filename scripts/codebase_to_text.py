import os
import sys
import argparse

def is_text_file(file_path, blocksize=512):
    """
    Check if a file is a text file.
    Reads a block of the file and tries to decode it.
    """
    try:
        with open(file_path, 'rb') as f:
            block = f.read(blocksize)
            if b'\0' in block:
                return False
            # Try decoding as utf-8
            block.decode('utf-8')
            return True
    except Exception:
        return False

def combine_files(input_dir, output_file='codebase.txt'):
    """
    Combine text files from specific folders and individual files within the input directory into one output file.
    Each file's content is labeled with its file type and relative path.
    """
    # Define the folders to target
    target_folders = ["app", "hooks", "lib", "components"]
    # Define the individual files to target
    target_files = []  # Add more file names as needed

    with open(output_file, 'w', encoding='utf-8') as outfile:
        # Process target folders
        for folder in target_folders:
            folder_path = os.path.join(input_dir, folder)
            if not os.path.isdir(folder_path):
                print(f"Warning: The folder '{folder}' does not exist in '{input_dir}'. Skipping.")
                continue

            for root, dirs, files in os.walk(folder_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    relative_path = os.path.relpath(file_path, input_dir)
                    _, ext = os.path.splitext(file)
                    
                    if is_text_file(file_path):
                        try:
                            with open(file_path, 'r', encoding='utf-8') as infile:
                                content = infile.read()
                        except UnicodeDecodeError:
                            # If utf-8 fails, try with 'latin1' or skip
                            try:
                                with open(file_path, 'r', encoding='latin1') as infile:
                                    content = infile.read()
                            except Exception as e:
                                print(f"Skipping {relative_path}: cannot decode file.")
                                continue
                        except Exception as e:
                            print(f"Skipping {relative_path}: {e}")
                            continue

                        # Write to the output file
                        outfile.write(f"===== File: {relative_path} =====\n")
                        outfile.write(f"Type: {ext if ext else 'No Extension'}\n")
                        outfile.write("----- Content Start -----\n")
                        outfile.write(content)
                        outfile.write("\n----- Content End -----\n\n")
                    else:
                        print(f"Skipping binary or non-text file: {relative_path}")

        # Process target files
        for file in target_files:
            file_path = os.path.join(input_dir, file)
            relative_path = os.path.relpath(file_path, input_dir)
            _, ext = os.path.splitext(file)

            if not os.path.isfile(file_path):
                print(f"Warning: The file '{file}' does not exist in '{input_dir}'. Skipping.")
                continue

            if is_text_file(file_path):
                try:
                    with open(file_path, 'r', encoding='utf-8') as infile:
                        content = infile.read()
                except UnicodeDecodeError:
                    # If utf-8 fails, try with 'latin1' or skip
                    try:
                        with open(file_path, 'r', encoding='latin1') as infile:
                            content = infile.read()
                    except Exception as e:
                        print(f"Skipping {relative_path}: cannot decode file.")
                        continue
                except Exception as e:
                    print(f"Skipping {relative_path}: {e}")
                    continue

                # Write to the output file
                outfile.write(f"===== File: {relative_path} =====\n")
                outfile.write(f"Type: {ext if ext else 'No Extension'}\n")
                outfile.write("----- Content Start -----\n")
                outfile.write(content)
                outfile.write("\n----- Content End -----\n\n")
            else:
                print(f"Skipping binary or non-text file: {relative_path}")

    print(f"All text files from specified folders and files have been combined into '{output_file}'.")

def main():
    parser = argparse.ArgumentParser(description="Combine text files from specific folders and individual files into one file.")
    parser.add_argument('directory', nargs='?', default='.', help='Relative directory path to process (default: current directory).')
    parser.add_argument('-o', '--output', default='codebase.txt', help='Output file name (default: codebase.txt).')
    
    args = parser.parse_args()
    
    input_dir = args.directory
    output_file = args.output

    # Resolve absolute path for accurate processing
    input_dir = os.path.abspath(input_dir)

    if not os.path.isdir(input_dir):
        print(f"Error: The directory '{input_dir}' does not exist or is not a directory.")
        sys.exit(1)
    
    combine_files(input_dir, output_file)

if __name__ == "__main__":
    main()

declare module '@editorjs/header' {
  import { BlockTool } from '@editorjs/editorjs';
  const Header: BlockTool;
  export default Header;
}

declare module '@editorjs/paragraph' {
  import { BlockTool } from '@editorjs/editorjs';
  const Paragraph: BlockTool;
  export default Paragraph;
}

declare module '@editorjs/image' {
  import { BlockTool } from '@editorjs/editorjs';
  const ImageTool: BlockTool;
  export default ImageTool;
}

declare module '@editorjs/list' {
  import { BlockTool } from '@editorjs/editorjs';
  const List: BlockTool;
  export default List;
}

declare module '@editorjs/quote' {
  import { BlockTool } from '@editorjs/editorjs';
  const Quote: BlockTool;
  export default Quote;
}

declare module '@editorjs/delimiter' {
  import { BlockTool } from '@editorjs/editorjs';
  const Delimiter: BlockTool;
  export default Delimiter;
}

declare module '@editorjs/embed' {
  import { BlockTool } from '@editorjs/editorjs';
  const Embed: BlockTool;
  export default Embed;
}

declare module '@editorjs/link' {
  import { BlockTool } from '@editorjs/editorjs';
  const LinkTool: BlockTool;
  export default LinkTool;
}

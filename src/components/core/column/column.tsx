  import type { HTMLAttributes, ReactNode } from 'react';
  import { forwardRef } from 'react';

  export interface ColumnProps extends HTMLAttributes<HTMLDivElement> {
    /** Children elements */
    children: ReactNode;
    /** Gap between items */
    gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    /** Horizontal alignment */
    align?: 'start' | 'center' | 'end' | 'stretch';
    /** Vertical alignment */
    justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
    /** Reverse order */
    reverse?: boolean;
    /** Additional class name */
    className?: string;
  }

  const gapStyles = {
    none: 'gap-0',
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  const alignStyles = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const justifyStyles = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  export const Column = forwardRef<HTMLDivElement, ColumnProps>(
    (
      {
        children,
        gap = 'md',
        align = 'stretch',
        justify = 'start',
        reverse = false,
        className = '',
        ...props
      },
      ref
    ) => {
      return (
        <div
          ref={ref}
          className={`
            flex
            ${reverse ? 'flex-col-reverse' : 'flex-col'}
            ${gapStyles[gap]}
            ${alignStyles[align]}
            ${justifyStyles[justify]}
            ${className}
          `}
          {...props}
        >
          {children}
        </div>
      );
    }
  );

  Column.displayName = 'Column';

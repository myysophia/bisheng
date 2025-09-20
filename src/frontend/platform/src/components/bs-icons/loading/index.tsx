import React, { forwardRef } from "react";
import { cname } from "../../bs-ui/utils";
import Spinner from "./Spinner.svg?react";

export const LoadIcon = forwardRef<
    SVGSVGElement & { className: any },
    React.PropsWithChildren<{ className?: string }>
>(({ className, ...props }, ref) => {
    return <Spinner ref={ref} {...props} className={cname('text-gray-50 animate-spin', className)} />;
});


export const LoadingIcon = forwardRef<
    SVGSVGElement & { className: any },
    React.PropsWithChildren<{ className?: string }>
>(({ className, ...props }, ref) => {
    return <Spinner ref={ref} {...props} className={cname('text-primary', className)} />;
});

export const LoadingHourglassIcon = forwardRef<
    SVGSVGElement & { className: any },
    React.PropsWithChildren<{ className?: string }>
>(({ className, ...props }, ref) => {
    return <Spinner ref={ref} {...props} className={cname('text-primary', className)} />;
});

export const SpinnerIcon = forwardRef<
    SVGSVGElement & { className: any },
    React.PropsWithChildren<{ className?: string }>
>(({ className, ...props }, ref) => {
    return <Spinner ref={ref} {...props} className={cname('text-primary', className)} />;
});

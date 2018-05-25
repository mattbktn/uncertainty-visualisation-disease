#  Heatmap for Rshiny

library("ggplot2")
library("RColorBrewer")
library("fields")

Hexagon <- function (x, y, unitcell = 1, col = col) {
  polygon(c(x, x, x + unitcell/2, x + unitcell, x + unitcell,
            x + unitcell/2), c(y + unitcell * 0.125,
                               y + unitcell * 0.875,
                               y + unitcell * 1.125,
                               y + unitcell * 0.875,
                               y + unitcell * 0.125,
                               y - unitcell * 0.125),
          col = col, border=NA)
}#function

mydata = read.table("vis_metrics.txt")

#Start with a matrix that would be the numerical representation of you heatmap
#called Heatmap_Matrix
#This matrix has the same number of rows as the SOM map
#and the same number of columns as the SOM map
#and each value in the Heatmap represents the value for one hexagon
#Here [1,1] will become the lower left node (1st row, 1st column),
#[1,2] will become the node to the right
#[2,1] will be the first node to the left in the second row
#So visually you work your way from bottom left to top right
par(mfrow=c(5, 5), mar=c(1,1,1,1))
for(t in 1:100){
  Heatmap_Matrix <- matrix(mydata[t,],2,2)
  x <- as.vector(Heatmap_Matrix)
  
  #Number of rows and columns of your SOM
  SOM_Rows <- dim(Heatmap_Matrix)[1]
  SOM_Columns <- dim(Heatmap_Matrix)[2]
  
  #To make room for the legend
  # par(mar = c(0.4, 2, 2, 7))
  
  #Initiate the plot window but do show any axes or points on the plot
  plot(0, 0, type = "n", axes = FALSE, xlim=c(0, SOM_Columns+0.5),
       ylim=c(0, SOM_Rows), xlab="", ylab= "", asp=1)
  
  #Create the color palette
  #I use designer.colors to interpolate 50 colors between
  #the maxmimum number of allowed values in Brewer
  #Just replace this with any other color palette you like
  ColRamp <- rev(designer.colors(n=50, col=brewer.pal(9, "Spectral")))
  
  #Make a vector with length(ColRamp) number of bins between the minimum and
  #maximum value of x.
  #Next match each point from x with one of the colors in ColorRamp
  ColorCode <- matrix("#FFFFFF", nrow=100, ncol=length(x)) #default is all white
  
  # for (i in 1:length(x))
  #   if (!is.na(x[i])) ColorCode[i] <- ColRamp[which.min(abs(Bins-x[i]))]
  
  colRamp1 <- colorRampPalette(c("green", "red"),space="Lab")
  # plot(1:100,pch=16,cex=2,col=colRamp1(100))
  colRamp2 <- colorRampPalette(c("lightblue2", "lightblue", "darkblue"),space="Lab")
  # plot(1:100,pch=16,cex=2,col=colRamp2(100))
  Bins1 <- seq(0, 40, length=100)
  Bins2 <- seq(0.1, 0.15, length=100)
  
  for (i in 1:length(x)){
    if (!is.na(x[i])){
      if(x[i] < 0.2 & t < 40){
        ColorCode[i] <- colRamp2(length(Bins2)+1)[which.min(abs(Bins2-as.numeric(x[i])))]
      }else{
        ColorCode[i] <- colRamp1(length(Bins1)+1)[which.min(abs(Bins1-as.numeric(x[i])))]
      }
    } 
  }
  
  #Actual plotting of hexagonal polygons on map
  offset <- 0.5 #offset for the hexagons when moving up a row
  for (row in 1:SOM_Rows) {
    for (column in 0:(SOM_Columns - 1))
      Hexagon(column + offset, row - 1, col = ColorCode[row + SOM_Rows * column])
    offset <- ifelse(offset, 0, 0.5)
  }
}

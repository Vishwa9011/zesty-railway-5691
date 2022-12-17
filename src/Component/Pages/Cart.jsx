import { collection, deleteDoc, getDocs, doc, updateDoc } from 'firebase/firestore'
import { Box, Button, Heading, Text, useDisclosure } from '@chakra-ui/react'
import { useGlobal } from '../../Context/GlobalDataProvider/GlobalProvider'
import { useAuth } from '../../Context/AuthContext/AuthContextProvider'
import { useProvider } from '../../Context/Provider/Provider'
import React, { useEffect, useState } from 'react'
import { db } from '../Firebase/firebase-config'
import { useNavigate } from 'react-router-dom'
import Loader from '../component/Loader'
import CartCard from '../Card/CartCard'
import Footer from '../Footer/Footer'
import Navbar from '../Navbar/Navbar'
import Alert from '../component/Alert'

const calcTotalPrice = (data) => {
     return data?.reduce((start, item) => {
          return start + (+item.price);
     }, 0)
}

const calcTotalSavings = (data) => {
     return calcTotalMrp(data) - calcTotalPrice(data);
}

const calcTotalMrp = (data) => {
     return data?.reduce((start, item) => {
          return start + (+item.mrp);
     }, 0)
}

const Cart = () => {
     const navigate = useNavigate();
     const { showMsg } = useGlobal();
     const { currentUser } = useAuth();
     const [limit, setLimit] = useState(0);
     const { setCartItemCount } = useProvider()
     const [change, setChange] = useState(false);
     const [cartData, setCartData] = useState([]);
     const [loading, setLoading] = useState(false);
     const [totalPrice, setTotalPrice] = useState(0);
     const [totalSavings, setTotalSavings] = useState(0);
     const { isOpen, onOpen, onClose } = useDisclosure();
     const usersCollectionRef = collection(db, `cart/${currentUser?.email}/cartData`);

     // * to send to the cartcard to update the item 
     const updateProduct = async (id, qty) => {
          const userDoc = doc(db, `cart/${currentUser?.email}/cartData`, id)
          const newFeilds = { selected_qty_purchase: qty };
          await updateDoc(userDoc, newFeilds).then(() => {
               setChange(!change)
          })
     }

     //* to send to the cartcard to delete the item
     const deleteProduct = async (id) => {
          const userDoc = doc(db, `cart/${currentUser?.email}/cartData`, id)
          await deleteDoc(userDoc).then(() => {
               setChange(!change)
          })
     }

     // * after confirmation empty the cart it will call fromthe alert box
     const CheckoutCart = () => {
          var count = 0;
          setLoading(true);
          const id = setInterval(() => {
               const userDoc = doc(db, `cart/${currentUser?.email}/cartData`, cartData[count].id)
               deleteDoc(userDoc).then(() => {
                    console.log("checkout done", count, "limit: ", limit)
                    count++;
                    if (count == limit) {
                         clearInterval(id)
                         setLoading(false)
                         showMsg("Your order has been placed", "success")
                         navigate("/", '/')
                    }
               })
          }, 600);
     }

     // * to take confimation to checkout from the user
     const Checkout = (limit) => {
          // * to check cart has something or not;
          if (!cartData.length) return showMsg("Cart is empty! Please add something", "warning")
          onOpen(); //* to open the alert box
          setLimit(limit) //* to tell how many items are there in your cart
     }

     // * to get all the cart item on first time or on every change
     useEffect(() => {
          setLoading(true)
          const getData = () => {
               getDocs(usersCollectionRef)
                    .then(res => {
                         const temp = (res.docs.map((doc) => ({ ...doc.data(), id: doc.id })))
                         setCartData(temp)
                         setCartItemCount(temp.length)
                         setLoading(false)
                    })
          }
          getData();
     }, [change])

     // * to get values of totalPrice and total savings
     useEffect(() => {
          setTotalPrice(calcTotalPrice(cartData));
          setTotalSavings(calcTotalSavings(cartData))
     }, [cartData])

     return (

          <>
               {loading && <Loader />}
               <Navbar />
               <Alert isOpen={isOpen} onOpen={onOpen} onClose={onClose} totalPrice={totalPrice.toFixed(2)} CheckoutCart={CheckoutCart} />
               <Box>
                    <Box w='90%' m='auto' my='5'>
                         <Heading my='2'>Your Basket</Heading>
                         <Box w='100%' h='80px' bg='blackAlpha.800' p='5' borderRadius='10px' display='flex' justifyContent='space-between' alignItems='center'>
                              <Box>
                                   <Box color={'white'}>Subtotal ({cartData.length} items) : <Text as='span' fontWeight={'bold'}>₹ {totalPrice.toFixed(2)}</Text> </Box>
                                   <Box color='green.300'>Savings: <Text as='span' fontWeight={'bold'}>₹ {totalSavings.toFixed(2)}</Text></Box>
                              </Box>
                              <Box>
                                   <Button bg='red.500' color='white' className='flex' colorScheme='red.600' _hover={{ background: "red.600" }} onClick={() => Checkout(cartData.length)}>Checkout</Button>
                              </Box>
                         </Box>
                    </Box>

                    <Box w='90%' m='auto'>
                         {cartData.map((item) => (
                              <CartCard key={item.id} data={item} updateProduct={updateProduct} deleteProduct={deleteProduct} />
                         ))}
                    </Box>

               </Box>
               <Footer />
          </>
     )
}

export default Cart